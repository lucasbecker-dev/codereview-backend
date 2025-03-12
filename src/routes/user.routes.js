const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, isResourceOwner } = require('../middleware/roleAuth');
const multer = require('multer');
const {
    getUsers,
    getUserById,
    updateUser,
    changePassword,
    updateNotificationPreferences,
    uploadProfilePicture,
    getUserProjects
} = require('../controllers/user.controller');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

// Routes that require admin/superadmin role
router.get('/', protect, authorize(['admin', 'superadmin']), getUsers);

// Routes for user profile
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);

// Route for password change - only the user can change their own password
router.put('/:id/password', protect, isResourceOwner(req => req.params.id), changePassword);

// Route for notification preferences - only the user can update their own preferences
router.put(
    '/:id/notification-preferences',
    protect,
    isResourceOwner(req => req.params.id),
    updateNotificationPreferences
);

// Route for profile picture upload - only the user can upload their own picture
router.post(
    '/:id/profile-picture',
    protect,
    isResourceOwner(req => req.params.id),
    upload.single('profileImage'),
    uploadProfilePicture
);

// Route for user projects
router.get('/:id/projects', protect, getUserProjects);

module.exports = router; 