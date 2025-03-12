const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    verifyUserForTesting
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

// Test routes - only available in non-production environments
if (process.env.NODE_ENV !== 'production') {
    router.post('/verify-test', verifyUserForTesting);
}

module.exports = router; 