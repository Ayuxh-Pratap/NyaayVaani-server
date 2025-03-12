import User from '../models/userModel.js';

export const getUser = async (req, res) => {
    try {
        // Get userId from req.body.userId (set by userAuth middleware)
        const { userId } = req.body;
        
        const user = await User.findById(userId).select('-password -confirmPassword -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching user details'
        });
    }
}