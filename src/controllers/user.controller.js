const { User } = require('../models');
const bcrypt = require('bcrypt');

/**
 * @desc    Get all users with filtering and pagination
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
    try {
        const {
            role,
            cohort,
            isActive,
            isVerified,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};

        if (role) filter.role = role;
        if (cohort) filter.cohort = cohort;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

        // Search by name or email
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const users = await User.find(filter)
            .select('-password')
            .populate('cohort', 'name')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await User.countDocuments(filter);

        res.status(200).json({
            users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('cohort', 'name');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is requesting their own profile or is an admin/superadmin
        if (
            req.user.id !== req.params.id &&
            !['admin', 'superadmin'].includes(req.user.role)
        ) {
            return res.status(403).json({
                message: 'Not authorized to access this user profile'
            });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error getting user by ID:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private
 */
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user is updating their own profile or is an admin/superadmin
        if (
            req.user.id !== userId &&
            !['admin', 'superadmin'].includes(req.user.role)
        ) {
            return res.status(403).json({
                message: 'Not authorized to update this user profile'
            });
        }

        const {
            firstName,
            lastName,
            email,
            role,
            cohort,
            isActive,
            bio,
            profilePicture
        } = req.body;

        // Get the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is being changed and if it's already in use
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Only admins/superadmins can change roles or active status
        if (['admin', 'superadmin'].includes(req.user.role)) {
            if (role) user.role = role;
            if (isActive !== undefined) user.isActive = isActive;
            if (cohort) user.cohort = cohort;
        } else if (req.user.id === userId) {
            // Regular users can only update their own profile info
            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            if (email) user.email = email;
            if (bio !== undefined) user.bio = bio;
            if (profilePicture) user.profilePicture = profilePicture;
        }

        // Save the updated user
        const updatedUser = await user.save();

        // Return user without password
        res.status(200).json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            cohort: updatedUser.cohort,
            isActive: updatedUser.isActive,
            isVerified: updatedUser.isVerified,
            profilePicture: updatedUser.profilePicture,
            bio: updatedUser.bio,
            notificationPreferences: updatedUser.notificationPreferences,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @desc    Change user password
 * @route   PUT /api/users/:id/password
 * @access  Private
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.params.id;

        // Users can only change their own password
        if (req.user.id !== userId) {
            return res.status(403).json({
                message: 'Not authorized to change this user\'s password'
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Validate request
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required'
            });
        }

        // Get user with password
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if current password matches
        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Validate new password
        if (newPassword.length < 8) {
            return res.status(400).json({
                message: 'New password must be at least 8 characters long'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @desc    Update notification preferences
 * @route   PUT /api/users/:id/notification-preferences
 * @access  Private
 */
const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.params.id;

        // Users can only update their own notification preferences
        if (req.user.id !== userId) {
            return res.status(403).json({
                message: 'Not authorized to update this user\'s notification preferences'
            });
        }

        const { email, inApp } = req.body;

        // Get user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update email preferences
        if (email) {
            if (email.projectStatus !== undefined) {
                user.notificationPreferences.email.projectStatus = email.projectStatus;
            }
            if (email.newComment !== undefined) {
                user.notificationPreferences.email.newComment = email.newComment;
            }
            if (email.newAssignment !== undefined) {
                user.notificationPreferences.email.newAssignment = email.newAssignment;
            }
            if (email.newSubmission !== undefined) {
                user.notificationPreferences.email.newSubmission = email.newSubmission;
            }
        }

        // Update in-app preferences
        if (inApp) {
            if (inApp.projectStatus !== undefined) {
                user.notificationPreferences.inApp.projectStatus = inApp.projectStatus;
            }
            if (inApp.newComment !== undefined) {
                user.notificationPreferences.inApp.newComment = inApp.newComment;
            }
            if (inApp.newAssignment !== undefined) {
                user.notificationPreferences.inApp.newAssignment = inApp.newAssignment;
            }
            if (inApp.newSubmission !== undefined) {
                user.notificationPreferences.inApp.newSubmission = inApp.newSubmission;
            }
        }

        // Save updated preferences
        await user.save();

        res.status(200).json({
            message: 'Notification preferences updated successfully',
            notificationPreferences: user.notificationPreferences
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @desc    Upload profile picture
 * @route   POST /api/users/:id/profile-picture
 * @access  Private
 */
const uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.params.id;

        // Users can only upload their own profile picture
        if (req.user.id !== userId) {
            return res.status(403).json({
                message: 'Not authorized to upload profile picture for this user'
            });
        }

        // Check if file exists in request
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Get user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // In a real implementation, we would:
        // 1. Upload the image to AWS S3 or similar storage
        // 2. Get the URL of the uploaded image
        // 3. Update the user's profilePicture field with the URL

        // For now, we'll simulate this by storing the file path
        // In a real implementation, this would be the S3 URL
        const storageService = require('../services/storage.service');
        const imageUrl = await storageService.uploadProfileImage(req.file);

        // Update user profile picture
        user.profilePicture = imageUrl;
        await user.save();

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePicture: user.profilePicture
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @desc    Get user's projects
 * @route   GET /api/users/:id/projects
 * @access  Private
 */
const getUserProjects = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check authorization
        if (
            req.user.id !== userId &&
            !['admin', 'superadmin', 'reviewer'].includes(req.user.role)
        ) {
            return res.status(403).json({
                message: 'Not authorized to view this user\'s projects'
            });
        }

        // Get projects based on user role
        let projects;
        const { Project } = require('../models');

        if (userExists.role === 'student') {
            // Get projects submitted by the student
            projects = await Project.find({ student: userId })
                .populate('student', 'firstName lastName email')
                .populate('reviewers', 'firstName lastName email')
                .sort({ submissionDate: -1 });
        } else if (userExists.role === 'reviewer') {
            // Get projects assigned to the reviewer
            projects = await Project.find({ reviewers: userId })
                .populate('student', 'firstName lastName email')
                .populate('reviewers', 'firstName lastName email')
                .sort({ submissionDate: -1 });
        }

        res.status(200).json(projects);
    } catch (error) {
        console.error('Error getting user projects:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    changePassword,
    updateNotificationPreferences,
    uploadProfilePicture,
    getUserProjects
}; 