import { Request, Response } from 'express';
import Notification from '../models/notification.model';

/**
 * Get current user's notifications
 * @route GET /api/notifications
 * @access Private
 */
export const getUserNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const { limit = 20, skip = 0, read } = req.query;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        let query: any = { recipient: userId };

        // Filter by read status if provided
        if (read !== undefined) {
            query.isRead = read === 'true';
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit));

        const totalCount = await Notification.countDocuments(query);

        return res.status(200).json({
            notifications,
            totalCount,
            hasMore: totalCount > Number(skip) + Number(limit)
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching notifications'
        });
    }
};

/**
 * Mark notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
export const markNotificationAsRead = async (req: Request, res: Response) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const notification = await Notification.findOne({
            _id: notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.isRead) {
            return res.status(200).json({ message: 'Notification already marked as read' });
        }

        notification.isRead = true;
        await notification.save();

        return res.status(200).json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({
            message: 'An error occurred while updating the notification'
        });
    }
};

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/read-all
 * @access Private
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({
            message: `${result.modifiedCount} notifications marked as read`
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({
            message: 'An error occurred while updating notifications'
        });
    }
};

/**
 * Get unread notification count
 * @route GET /api/notifications/unread-count
 * @access Private
 */
export const getUnreadNotificationCount = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const count = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        return res.status(200).json({ count });
    } catch (error) {
        console.error('Error counting unread notifications:', error);
        return res.status(500).json({
            message: 'An error occurred while counting unread notifications'
        });
    }
}; 