const { validationResult } = require('express-validator');
const User = require('../models/User');

// Get all users (admin only)
exports.getAllUsers = async (req, res, next) => {
    try {
        // Add pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Add filtering
        const filter = {};
        if (req.query.role) {
            filter.role = req.query.role;
        }
        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === 'true';
        }

        const users = await User.find(filter)
            .skip(skip)
            .limit(limit)
            .select('-password -verificationToken')
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(filter);

        res.json({
            users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password -verificationToken');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
};

// Update user
exports.updateUser = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { firstName, lastName, bio } = req.body;

        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is authorized to update this profile
        // This will be implemented with auth middleware

        // Update user fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (bio !== undefined) user.bio = bio;

        await user.save();

        res.json({
            message: 'User updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

// Get user's projects
exports.getUserProjects = async (req, res, next) => {
    try {
        // This will be implemented when Project model is created
        res.status(501).json({ message: 'Not implemented yet' });
    } catch (error) {
        next(error);
    }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { email, inApp } = req.body;

        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is authorized to update this profile
        // This will be implemented with auth middleware

        // Update notification preferences
        if (email) {
            user.notificationPreferences.email = {
                ...user.notificationPreferences.email,
                ...email
            };
        }

        if (inApp) {
            user.notificationPreferences.inApp = {
                ...user.notificationPreferences.inApp,
                ...inApp
            };
        }

        await user.save();

        res.json({
            message: 'Notification preferences updated successfully',
            notificationPreferences: user.notificationPreferences
        });
    } catch (error) {
        next(error);
    }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res, next) => {
    try {
        // This will be implemented with file upload middleware
        res.status(501).json({ message: 'Not implemented yet' });
    } catch (error) {
        next(error);
    }
}; 