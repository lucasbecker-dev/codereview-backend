const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    getMe,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    verifyUserForTesting
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const {
    validate,
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    verifyEmailValidation
} = require('../middleware/validation');

// Public routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/logout', logout);
router.post('/verify', validate(verifyEmailValidation), verifyEmail);
router.post('/resend-verification', validate(forgotPasswordValidation), resendVerification);
router.post('/forgot-password', validate(forgotPasswordValidation), forgotPassword);
router.post('/reset-password', validate(resetPasswordValidation), resetPassword);

// Protected routes
router.get('/me', protect, getMe);

// Test routes - only available in non-production environments
if (process.env.NODE_ENV !== 'production') {
    router.post('/verify-test', verifyUserForTesting);
}

module.exports = router; 