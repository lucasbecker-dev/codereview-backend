import express from 'express';
import {
    getAllUsers,
    getUserById,
    updateUser,
    getUserProjects,
    updateNotificationPreferences,
    uploadProfilePicture
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Get all users - admin only
router.get(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    getAllUsers
);

// Get user by ID
router.get(
    '/:id',
    authenticate,
    getUserById
);

// Update user
router.put(
    '/:id',
    authenticate,
    updateUser
);

// Get user's projects
router.get(
    '/:id/projects',
    authenticate,
    getUserProjects
);

// Update notification preferences
router.put(
    '/:id/notification-preferences',
    authenticate,
    updateNotificationPreferences
);

// Upload profile picture
router.post(
    '/:id/profile-picture',
    authenticate,
    uploadProfilePicture
);

export default router; 