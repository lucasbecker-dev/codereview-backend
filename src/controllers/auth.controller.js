const { User } = require('../models');
const { generateJWT, generateVerificationToken, hashToken, generateExpirationDate } = require('../utils/tokenGenerator');
const sendEmail = require('../services/email.service');

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
        const verificationToken = generateVerificationToken();
        const hashedToken = hashToken(verificationToken);

        // Create user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            role: role || 'student', // Default to student if no role provided
            verificationToken: hashedToken,
        });

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        try {
            await sendEmail({
                to: email,
                subject: 'Please verify your email',
                text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
                html: `<p>Please verify your email by clicking on the following link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
            });

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

        res.json({
            token,
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
 * @route POST /api/auth/verify/:token
 * @access Public
 */
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = hashToken(token);

        const user = await User.findOne({ verificationToken: hashedToken });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Update user verification status
        user.isVerified = true;
        user.verificationToken = undefined;
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
        const verificationToken = generateVerificationToken();
        const hashedToken = hashToken(verificationToken);

        user.verificationToken = hashedToken;
        await user.save();

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        try {
            await sendEmail({
                to: email,
                subject: 'Please verify your email',
                text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
                html: `<p>Please verify your email by clicking on the following link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
            });

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
        const resetToken = generateVerificationToken();
        const hashedToken = hashToken(resetToken);

        // Save token to user
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = generateExpirationDate(1); // 1 hour expiration
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        try {
            await sendEmail({
                to: email,
                subject: 'Password Reset Request',
                text: `You requested a password reset. Please click on the following link to reset your password: ${resetUrl}. This link is valid for 1 hour.`,
                html: `<p>You requested a password reset. Please click on the following link to reset your password: <a href="${resetUrl}">${resetUrl}</a>. This link is valid for 1 hour.</p>`,
            });

            res.json({ message: 'Password reset email sent successfully' });
        } catch (error) {
            console.error('Email sending error:', error);

            // Remove reset token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            res.status(500).json({ message: 'Error sending password reset email' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during forgot password' });
    }
};

/**
 * Reset password with token
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const hashedToken = hashToken(token);

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

module.exports = {
    register,
    login,
    getMe,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
}; 