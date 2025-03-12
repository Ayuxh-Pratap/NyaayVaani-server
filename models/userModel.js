import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (value) {
                return value === this.password;
            },
            message: 'Passwords do not match'
        }
    },
    preferredLanguage: {
        type: String,
        required: [true, 'Please select a preferred language'],
        enum: ['English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Malayalam', 'Odia', 'Punjabi', 'Assamese'],
        default: 'English'
    },
    state: {
        type: String,
        required: [true, 'Please provide your state'],
        trim: true
    },
    verifyOtp: {
        type: String,
        default: ''
    },
    verifyOtpExpireAt: {
        type: Number,
        default: 0
    },
    isAccountVerified: {
        type: Boolean,
        default: false
    },
    resetOtp: {
        type: String,
        default: ''
    },
    resetOtpExpireAt: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Remove confirmPassword from the response
userSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.confirmPassword;
        return ret;
    }
});

const User = mongoose.model('User', userSchema);

export default User; 