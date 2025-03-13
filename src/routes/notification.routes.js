const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

// All notification routes require authentication
router.use(protect);

// Get all notifications for the current user
router.get('/', notificationController.getUserNotifications);

// Get count of unread notifications
router.get('/unread-count', notificationController.getUnreadNotificationCount);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllNotificationsAsRead);

// Mark a specific notification as read
router.put('/:id/read', notificationController.markNotificationAsRead);

module.exports = router; 