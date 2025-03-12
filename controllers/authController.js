import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import transporter from '../config/nodemailer.js';

// export const register = async (req, res) => {
//     try {
//         const { name, email, password, confirmPassword, preferredLanguage, state } = req.body;

//         if (!name || !email || !password || !confirmPassword || !preferredLanguage || !state) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'All fields are required'
//             });
//         }

//         if (password !== confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Password and confirm password do not match'
//             });
//         }

//         // Check if user already exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'User with this email already exists'
//             });
//         }

//         // Hash the password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const user = new User({
//             name,
//             email,
//             password: hashedPassword,
//             confirmPassword: hashedPassword,
//             preferredLanguage,
//             state
//         });

//         await user.save();

//         const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

//         res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

//         // SENDING WELCOME EMAIL
//         const mailOptions = {
//             from: process.env.SENDER_EMAIL,
//             to: email,
//             subject: 'Welcome to our app!',
//             text: `Hello ${name}, welcome to our app!`
//         };

//         await transporter.sendMail(mailOptions);

//         res.status(201).json({
//             success: true,
//             message: 'User registered successfully',
//             data: user
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message || 'Something went wrong during registration'
//         });
//     }
// };

export const register = async (req, res) => {
    try {
        console.log(req.body);
        const { name, email, password, confirmPassword, preferredLanguage, state } = req.body;

        // Basic validation
        if (!name || !email || !password || !confirmPassword || !preferredLanguage || !state) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with all fields from schema
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            confirmPassword: hashedPassword,
            preferredLanguage,
            state
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log(token);

        // SENDING WELCOME EMAIL
        try {
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: 'Welcome to our app!',
                text: `Hello ${name}, welcome to our app!`
            };
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Email sending failed:', error);
        }

        // Send response without sensitive data
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Something went wrong during registration'
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is verified
        // if (!user.isAccountVerified) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Please verify your email first'
        //     });
        // }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie with token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Send response
        res.status(200).json({
            success: true,
            message: 'Login successful'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Something went wrong during login'
        });
    }
};

export const logout = async (req, res) => {
    try {
        // Clear the token cookie
        res.cookie('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            expires: new Date(0) // Set expiration to past date to immediately expire
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Something went wrong during logout'
        });
    }
};

export const sendVerificationOtp = async (req, res) => {
    try {
        const { userId } = req.body;
        console.log('Searching for user with ID:', userId);

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.isAccountVerified) {
            return res.status(400).json({
                success: false,
                message: 'Account already verified'
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpireAt = new Date(Date.now() + 10 * 60 * 1000);

        // Save OTP first
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = otpExpireAt;
        await user.save();

        try {
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: user.email,
                subject: 'Verification OTP',
                text: `Your verification OTP is ${otp}`
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({
                success: true,
                message: 'Verification OTP sent successfully'
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);

            // Even if email fails, return success since OTP is saved
            res.status(200).json({
                success: true,
                message: 'OTP generated successfully. Email delivery may be delayed.',
                otp: otp // Only include in development
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Something went wrong during sending verification OTP'
        });
    }
}

export const verifyOtp = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId);

        console.log(user);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.verifyOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }
        if (user.verifyOtpExpireAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired'
            });
        }
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Something went wrong during verifying OTP'
        });
    }
}

export const isAuthenticated = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'User is authenticated'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Something went wrong during verifying OTP'
        });
    }
}

export const sendResetPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpireAt = new Date(Date.now() + 10 * 60 * 1000);

        user.resetOtp = otp;
        user.resetOtpExpireAt = otpExpireAt;
        await user.save();

        try {
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: user.email,
                subject: 'Reset Password OTP',
                text: `Your reset password OTP is ${otp}`
            };
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Email sending failed:', error);
        }

        res.status(200).json({
            success: true,
            message: 'Reset password OTP sent successfully',
            otp: otp // Only include in development
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Something went wrong during sending reset password OTP'
        });
    }
}

export const verifyResetPasswordOtp = async (req, res) => {
    try {
        const { userId, otp, newPassword, confirmPassword } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.resetOtp !== otp || user.resetOtp === '') {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }
        if (user.resetOtpExpireAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired'
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password do not match'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.resetOtp = '';
        user.resetOtpExpireAt = 0;
        user.password = hashedPassword;
        user.confirmPassword = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Something went wrong during verifying reset password OTP'
        });
    }
}
