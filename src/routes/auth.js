const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth');

// Register a new user
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required')
    ],
    authController.register
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    authController.login
);

// Get current user
router.get('/me', authController.getCurrentUser);

// Verify email
router.get('/verify/:token', authController.verifyEmail);

// Resend verification email
router.post('/resend-verification', authController.resendVerification);

// Forgot password
router.post(
    '/forgot-password',
    [
        body('email').isEmail().withMessage('Please enter a valid email')
    ],
    authController.forgotPassword
);

// Reset password
router.post(
    '/reset-password/:token',
    [
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    ],
    authController.resetPassword
);

module.exports = router; 