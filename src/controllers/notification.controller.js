const notificationService = require('../services/notification.service');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Get all notifications for the current user
 * @route GET /api/notifications
 * @access Private
 */
exports.getUserNotifications = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { limit, skip, unreadOnly } = req.query;

    const options = {
        limit: limit ? parseInt(limit, 10) : 10,
        skip: skip ? parseInt(skip, 10) : 0,
        unreadOnly: unreadOnly === 'true'
    };

    const notifications = await notificationService.getUserNotifications(userId, options);

    res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications
    });
});

/**
 * Mark a notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
exports.markNotificationAsRead = catchAsync(async (req, res) => {
    const notificationId = req.params.id;

    // Verify the notification belongs to the current user
    const notification = await notificationService.markNotificationAsRead(notificationId);

    if (!notification) {
        return res.status(404).json({
            success: false,
            message: 'Notification not found'
        });
    }

    // Check if the notification belongs to the current user
    if (notification.recipient.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'You are not authorized to update this notification'
        });
    }

    res.status(200).json({
        success: true,
        data: notification
    });
});

/**
 * Mark all notifications as read for the current user
 * @route PUT /api/notifications/read-all
 * @access Private
 */
exports.markAllNotificationsAsRead = catchAsync(async (req, res) => {
    const userId = req.user._id;

    const result = await notificationService.markAllNotificationsAsRead(userId);

    res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: result
    });
});

/**
 * Get count of unread notifications for the current user
 * @route GET /api/notifications/unread-count
 * @access Private
 */
exports.getUnreadNotificationCount = catchAsync(async (req, res) => {
    const userId = req.user._id;

    const count = await notificationService.getUnreadNotificationCount(userId);

    res.status(200).json({
        success: true,
        data: { count }
    });
}); 