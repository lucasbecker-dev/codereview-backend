import express from 'express';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Get user's notifications
router.get('/', authenticate, getUserNotifications);

// Mark notification as read
router.put('/:id/read', authenticate, markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', authenticate, markAllNotificationsAsRead);

// Get unread notification count
router.get('/unread-count', authenticate, getUnreadNotificationCount);

export default router; 