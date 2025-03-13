const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./email.service');

/**
 * Create a notification and send email if user has email notifications enabled
 * @param {Object} notificationData - Notification data
 * @param {String} notificationData.recipient - User ID of the recipient
 * @param {String} notificationData.type - Type of notification (projectStatus, newComment, newAssignment, newSubmission)
 * @param {String} notificationData.content - Content of the notification
 * @param {Object} notificationData.relatedResource - Related resource information
 * @param {String} notificationData.relatedResource.type - Type of related resource (project, comment, assignment)
 * @param {String} notificationData.relatedResource.id - ID of related resource
 * @returns {Promise<Object>} - Created notification
 */
exports.createNotification = async (notificationData) => {
    try {
        const { recipient, type, content, relatedResource } = notificationData;

        // Create notification
        const notification = await Notification.create({
            recipient,
            type,
            content,
            relatedResource,
            isRead: false,
            emailSent: false
        });

        // Get user notification preferences
        const user = await User.findById(recipient);

        // Send email if user has email notifications enabled for this type
        if (user && user.notificationPreferences &&
            user.notificationPreferences.email &&
            user.notificationPreferences.email[type]) {

            try {
                await emailService.sendNotificationEmail({
                    to: user.email,
                    subject: `CodeReview Platform - ${getNotificationSubject(type)}`,
                    content,
                    type,
                    firstName: user.firstName
                });

                // Update notification to mark email as sent
                notification.emailSent = true;
                await notification.save();
            } catch (error) {
                console.error('Error sending notification email:', error);
                // Continue even if email fails
            }
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

/**
 * Get all notifications for a user
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 * @param {Number} options.limit - Maximum number of notifications to return
 * @param {Number} options.skip - Number of notifications to skip
 * @param {Boolean} options.unreadOnly - Whether to return only unread notifications
 * @returns {Promise<Array>} - Array of notifications
 */
exports.getUserNotifications = async (userId, options = {}) => {
    try {
        const { limit = 10, skip = 0, unreadOnly = false } = options;

        const query = { recipient: userId };
        if (unreadOnly) {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return notifications;
    } catch (error) {
        console.error('Error getting user notifications:', error);
        throw error;
    }
};

/**
 * Mark a notification as read
 * @param {String} notificationId - Notification ID
 * @returns {Promise<Object>} - Updated notification
 */
exports.markNotificationAsRead = async (notificationId) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );

        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications for a user as read
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Update result
 */
exports.markAllNotificationsAsRead = async (userId) => {
    try {
        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );

        return result;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

/**
 * Get count of unread notifications for a user
 * @param {String} userId - User ID
 * @returns {Promise<Number>} - Count of unread notifications
 */
exports.getUnreadNotificationCount = async (userId) => {
    try {
        const count = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        return count;
    } catch (error) {
        console.error('Error getting unread notification count:', error);
        throw error;
    }
};

/**
 * Get notification subject based on type
 * @param {String} type - Notification type
 * @returns {String} - Notification subject
 */
function getNotificationSubject(type) {
    switch (type) {
        case 'projectStatus':
            return 'Project Status Update';
        case 'newComment':
            return 'New Comment';
        case 'newAssignment':
            return 'New Assignment';
        case 'newSubmission':
            return 'New Project Submission';
        default:
            return 'Notification';
    }
} 