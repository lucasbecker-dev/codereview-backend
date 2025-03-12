const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router; 