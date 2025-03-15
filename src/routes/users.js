const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user');
const authMiddleware = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authMiddleware.isAdmin, userController.getAllUsers);

// Get user by ID
router.get('/:id', authMiddleware.isAuthenticated, userController.getUserById);

// Update user
router.put(
    '/:id',
    authMiddleware.isAuthenticated,
    [
        body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
        body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
        body('bio').optional().isString().withMessage('Bio must be a string')
    ],
    userController.updateUser
);

// Get user's projects
router.get('/:id/projects', authMiddleware.isAuthenticated, userController.getUserProjects);

// Update notification preferences
router.put(
    '/:id/notification-preferences',
    authMiddleware.isAuthenticated,
    userController.updateNotificationPreferences
);

// Upload profile picture
router.post(
    '/:id/profile-picture',
    authMiddleware.isAuthenticated,
    userController.uploadProfilePicture
);

module.exports = router; 