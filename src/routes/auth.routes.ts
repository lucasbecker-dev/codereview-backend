import express from 'express';
import {
    register,
    login,
    getCurrentUser,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @desc Login user and get token
 * @access Public
 */
router.post('/login', login);

/**
 * @route GET /api/auth/me
 * @desc Get current user information
 * @access Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route POST /api/auth/verify/:token
 * @desc Verify user email address
 * @access Public
 */
router.post('/verify/:token', verifyEmail);

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend verification email
 * @access Public
 */
router.post('/resend-verification', resendVerification);

/**
 * @route POST /api/auth/forgot-password
 * @desc Initiate password reset
 * @access Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password/:token', resetPassword);

export default router; 