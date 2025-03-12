import express from 'express';
import { register, login, logout, verifyOtp, sendVerificationOtp, isAuthenticated, sendResetPasswordOtp, verifyResetPasswordOtp } from '../controllers/authController.js';
import { userAuth } from '../middleware.js/userAuth.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.post('/send-verification-otp', userAuth, sendVerificationOtp);
router.post('/verify-otp', userAuth, verifyOtp);

router.get('/is-authenticated', userAuth, isAuthenticated);

router.post('/send-reset-password-otp', sendResetPasswordOtp);
router.post('/verify-reset-password-otp', userAuth, verifyResetPasswordOtp);

export default router; 