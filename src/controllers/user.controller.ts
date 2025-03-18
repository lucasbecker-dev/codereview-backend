import { Request, Response } from 'express';
import User from '../models/user.model';
import Project from '../models/project.model';

/**
 * Get all users
 * @route GET /api/users
 * @access Private (Admin/SuperAdmin)
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { role, cohort, isActive, search } = req.query;

        let query: any = {};

        // Apply filters if provided
        if (role) query.role = role;
        if (cohort) query.cohort = cohort;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            const searchRegex = new RegExp(search as string, 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex }
            ];
        }

        const users = await User.find(query)
            .select('-password -verificationToken')
            .populate('cohort', 'name startDate endDate');

        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching users'
        });
    }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -verificationToken')
            .populate('cohort', 'name startDate endDate');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching the user'
        });
    }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, bio, role, cohort, isActive } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (bio !== undefined) user.bio = bio;
        if (role) user.role = role;
        if (cohort) user.cohort = cohort;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        return res.status(200).json({
            message: 'User updated successfully',
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                bio: user.bio,
                cohort: user.cohort,
                isActive: user.isActive,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            message: 'An error occurred while updating the user'
        });
    }
};

/**
 * Get user's projects
 * @route GET /api/users/:id/projects
 * @access Private
 */
export const getUserProjects = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let projects;

        // If user is a student, get projects they submitted
        if (user.role === 'student') {
            projects = await Project.find({ student: user._id })
                .populate('reviewers', 'firstName lastName email')
                .sort({ submissionDate: -1 });
        }
        // If user is a reviewer, get projects they are assigned to review
        else if (user.role === 'reviewer') {
            projects = await Project.find({ reviewers: user._id })
                .populate('student', 'firstName lastName email')
                .sort({ submissionDate: -1 });
        }

        return res.status(200).json({ projects });
    } catch (error) {
        console.error('Error fetching user projects:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching user projects'
        });
    }
};

/**
 * Update notification preferences
 * @route PUT /api/users/:id/notification-preferences
 * @access Private
 */
export const updateNotificationPreferences = async (req: Request, res: Response) => {
    try {
        const { notificationPreferences } = req.body;

        if (!notificationPreferences) {
            return res.status(400).json({ message: 'Notification preferences are required' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.notificationPreferences = {
            ...user.notificationPreferences,
            ...notificationPreferences
        };

        await user.save();

        return res.status(200).json({
            message: 'Notification preferences updated successfully',
            notificationPreferences: user.notificationPreferences
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        return res.status(500).json({
            message: 'An error occurred while updating notification preferences'
        });
    }
};

/**
 * Upload profile picture
 * @route POST /api/users/:id/profile-picture
 * @access Private
 */
export const uploadProfilePicture = async (req: Request, res: Response) => {
    try {
        // This endpoint will be implemented after S3 service setup
        // For now, we'll just update the profilePicture field with a URL
        const { profilePictureUrl } = req.body;

        if (!profilePictureUrl) {
            return res.status(400).json({ message: 'Profile picture URL is required' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profilePicture = profilePictureUrl;
        await user.save();

        return res.status(200).json({
            message: 'Profile picture updated successfully',
            profilePicture: user.profilePicture
        });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        return res.status(500).json({
            message: 'An error occurred while updating profile picture'
        });
    }
}; 