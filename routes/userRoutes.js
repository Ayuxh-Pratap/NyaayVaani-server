import express from 'express';
import { getUser } from '../controllers/userController.js';
import { userAuth } from '../middleware.js/userAuth.js';

const router = express.Router();

// Protected routes - require authentication
router.get('/me', userAuth, getUser);

export default router; 