import { Request, Response } from 'express';
import crypto from 'crypto';
import User, { UserRole } from '../models/user.model';
import { generateAuthToken } from '../middleware/auth.middleware';

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Validate role
        if (role && !Object.values(UserRole).includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Create verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            role: role || UserRole.STUDENT,
            verificationToken,
        });

        await user.save();

        // TODO: Send verification email (will be implemented in email service)

        return res.status(201).json({
            message: 'User registered successfully. Please check your email for verification.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            message: 'An error occurred during registration. Please try again.'
        });
    }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Your account has been deactivated. Please contact support.' });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is verified (except for admin users who might be pre-verified)
        if (!user.isVerified && ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole)) {
            return res.status(401).json({
                message: 'Please verify your email address before logging in',
                needsVerification: true,
                email: user.email
            });
        }

        // Generate token
        const token = generateAuthToken(user);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Return user data and token
        return res.status(200).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profilePicture: user.profilePicture,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'An error occurred during login. Please try again.' });
    }
};

/**
 * Get current user info
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        return res.status(200).json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            profilePicture: user.profilePicture,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            bio: user.bio,
            notificationPreferences: user.notificationPreferences
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'An error occurred while fetching user data' });
    }
};

/**
 * Verify email address with token
 * @route POST /api/auth/verify/:token
 * @access Public
 */
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        // Find user with matching verification token
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Update user status to verified
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({ message: 'An error occurred during verification' });
    }
};

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 * @access Public
 */
export const resendVerification = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Check if already verified
        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        await user.save();

        // TODO: Send verification email (will be implemented in email service)

        return res.status(200).json({ message: 'Verification email sent successfully' });
    } catch (error) {
        console.error('Resend verification error:', error);
        return res.status(500).json({ message: 'An error occurred while resending verification email' });
    }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            // Security best practice: don't reveal if email exists or not
            return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Store hashed token in user document
        user.verificationToken = hashedToken;
        await user.save();

        // TODO: Send password reset email (will be implemented in email service)

        return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: 'An error occurred while processing your request' });
    }
};

/**
 * Reset password using token
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Find user with matching reset token
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = password;
        user.verificationToken = undefined;
        await user.save();

        return res.status(200).json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'An error occurred while resetting your password' });
    }
}; 