const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

describe('Notification API', () => {
    let testUser;
    let authToken;
    let testNotification;

    beforeAll(async () => {
        // Create a test user
        testUser = await User.create({
            email: 'notification-test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            role: 'student',
            isVerified: true,
            notificationPreferences: {
                email: {
                    projectStatus: true,
                    newComment: true,
                    newAssignment: true,
                    newSubmission: true
                },
                inApp: {
                    projectStatus: true,
                    newComment: true,
                    newAssignment: true,
                    newSubmission: true
                }
            }
        });

        // Generate auth token for the test user
        authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);

        // Create test notifications
        testNotification = await Notification.create({
            recipient: testUser._id,
            type: 'newComment',
            content: 'Someone commented on your project',
            relatedResource: {
                type: 'comment',
                id: new mongoose.Types.ObjectId()
            }
        });

        // Create a few more notifications for testing
        await Notification.create([
            {
                recipient: testUser._id,
                type: 'projectStatus',
                content: 'Your project status has been updated',
                relatedResource: {
                    type: 'project',
                    id: new mongoose.Types.ObjectId()
                }
            },
            {
                recipient: testUser._id,
                type: 'newAssignment',
                content: 'You have been assigned a new project',
                relatedResource: {
                    type: 'assignment',
                    id: new mongoose.Types.ObjectId()
                }
            }
        ]);
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteOne({ _id: testUser._id });
        await Notification.deleteMany({ recipient: testUser._id });
        await mongoose.connection.close();
    });

    describe('GET /api/notifications', () => {
        it('should get all notifications for the authenticated user', async () => {
            const res = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThanOrEqual(3);
        });

        it('should get only unread notifications when unreadOnly is true', async () => {
            const res = await request(app)
                .get('/api/notifications?unreadOnly=true')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.every(notification => notification.isRead === false)).toBe(true);
        });
    });

    describe('GET /api/notifications/unread-count', () => {
        it('should get the count of unread notifications', async () => {
            const res = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('count');
            expect(typeof res.body.data.count).toBe('number');
        });
    });

    describe('PUT /api/notifications/:id/read', () => {
        it('should mark a notification as read', async () => {
            const res = await request(app)
                .put(`/api/notifications/${testNotification._id}/read`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('isRead', true);
        });

        it('should return 404 for non-existent notification', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/notifications/${fakeId}/read`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT /api/notifications/read-all', () => {
        it('should mark all notifications as read', async () => {
            const res = await request(app)
                .put('/api/notifications/read-all')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            // Verify all notifications are marked as read
            const unreadCount = await Notification.countDocuments({
                recipient: testUser._id,
                isRead: false
            });
            expect(unreadCount).toBe(0);
        });
    });
}); 