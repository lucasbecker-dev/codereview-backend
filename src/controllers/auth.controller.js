const { User } = require('../models');
const { generateJWT, generateVerificationToken, generatePasswordResetToken, hashToken, isTokenExpired } = require('../utils/tokenGenerator');
const emailService = require('../services/email.service');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate verification token
        const { token, expiresAt } = generateVerificationToken();
        const hashedToken = hashToken(token);

        // Create user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            role: role || 'student', // Default to student if no role provided
            verificationToken: hashedToken,
            verificationTokenExpires: expiresAt,
            isActive: true
        });

        // Send verification email
        try {
            await emailService.sendVerificationEmail(
                email,
                firstName,
                token
            );

            res.status(201).json({
                message: 'User registered successfully. Please check your email to verify your account.',
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isVerified: user.isVerified,
                },
            });
        } catch (error) {
            console.error('Email sending error:', error);

            // Still create the user but inform about email issue
            res.status(201).json({
                message: 'User registered successfully but verification email could not be sent. Please contact support.',
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isVerified: user.isVerified,
                },
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email before logging in' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Your account has been deactivated. Please contact support.' });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate JWT token
        const token = generateJWT(user._id);

        // Set token as HttpOnly cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        res.json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profilePicture: user.profilePicture,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Public
 */
const logout = async (req, res) => {
    try {
        // Clear the auth cookie
        res.clearCookie('auth_token');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error during logout' });
    }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -verificationToken');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
};

/**
 * Verify email with token
 * @route POST /api/auth/verify
 * @access Public
 */
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }

        const hashedToken = hashToken(token);

        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Update user verification status
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
};

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 * @access Public
 */
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new verification token
        const { token, expiresAt } = generateVerificationToken();
        const hashedToken = hashToken(token);

        user.verificationToken = hashedToken;
        user.verificationTokenExpires = expiresAt;
        await user.save();

        // Send verification email
        try {
            await emailService.sendVerificationEmail(
                email,
                user.firstName,
                token
            );

            res.json({ message: 'Verification email sent successfully' });
        } catch (error) {
            console.error('Email sending error:', error);
            res.status(500).json({ message: 'Error sending verification email' });
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Server error during resend verification' });
    }
};

/**
 * Forgot password - send reset email
 * @route POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const { token, expiresAt } = generatePasswordResetToken();
        const hashedToken = hashToken(token);

        // Save token to user
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = expiresAt;
        await user.save();

        // Send password reset email
        try {
            await emailService.sendPasswordResetEmail(
                email,
                user.firstName,
                token
            );

            res.json({ message: 'Password reset email sent successfully' });
        } catch (error) {
            console.error('Email sending error:', error);
            res.status(500).json({ message: 'Error sending password reset email' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during forgot password' });
    }
};

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 * @access Public
 */
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        const hashedToken = hashToken(token);

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

/**
 * @desc    Verify user email for testing purposes
 * @route   POST /api/auth/verify-test
 * @access  Public (but should be restricted in production)
 */
const verifyUserForTesting = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'User verified successfully' });
    } catch (error) {
        console.error('Error verifying user for testing:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    getMe,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    verifyUserForTesting
}; 