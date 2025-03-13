const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User } = require('../models');
const fs = require('fs');
const path = require('path');

// Test user credentials
const testUser = {
    email: 'testuser@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'student'
};

const adminUser = {
    email: 'admin@example.com',
    password: 'Password123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
};

// Store cookies and IDs for authenticated requests
let userCookies;
let adminCookies;
let userId;
let adminId;

describe('User API', () => {
    beforeAll(async () => {
        // Clear test data
        await User.deleteMany({ email: { $in: [testUser.email, adminUser.email] } });
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({ email: { $in: [testUser.email, adminUser.email] } });

        // Close MongoDB connection
        await mongoose.connection.close();
    });

    describe('User Registration and Authentication', () => {
        test('Should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toContain('User registered successfully');
            expect(res.body.user.email).toBe(testUser.email);
        });

        test('Should register an admin user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(adminUser);

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toContain('User registered successfully');
            expect(res.body.user.email).toBe(adminUser.email);
        });

        test('Should verify users for testing', async () => {
            // Get user IDs
            const user = await User.findOne({ email: testUser.email });
            const admin = await User.findOne({ email: adminUser.email });

            userId = user._id.toString();
            adminId = admin._id.toString();

            // Verify test user
            const userRes = await request(app)
                .post('/api/auth/verify-test')
                .send({ userId });

            expect(userRes.statusCode).toEqual(200);
            expect(userRes.body.message).toContain('User verified successfully');

            // Verify admin user
            const adminRes = await request(app)
                .post('/api/auth/verify-test')
                .send({ userId: adminId });

            expect(adminRes.statusCode).toEqual(200);
            expect(adminRes.body.message).toContain('User verified successfully');
        });

        test('Should login users and set cookies', async () => {
            // Login as test user
            const userRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(userRes.statusCode).toEqual(200);
            expect(userRes.body.user).toBeDefined();
            expect(userRes.body.user.email).toBe(testUser.email);
            expect(userRes.headers['set-cookie']).toBeDefined();
            userCookies = userRes.headers['set-cookie'];

            // Login as admin
            const adminRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: adminUser.email,
                    password: adminUser.password
                });

            expect(adminRes.statusCode).toEqual(200);
            expect(adminRes.body.user).toBeDefined();
            expect(adminRes.body.user.email).toBe(adminUser.email);
            expect(adminRes.headers['set-cookie']).toBeDefined();
            adminCookies = adminRes.headers['set-cookie'];
        });
    });

    describe('User Management', () => {
        test('Should get all users (admin only)', async () => {
            // Admin should be able to get all users
            const adminRes = await request(app)
                .get('/api/users')
                .set('Cookie', adminCookies);

            expect(adminRes.statusCode).toEqual(200);
            expect(Array.isArray(adminRes.body.users)).toBe(true);
            expect(adminRes.body.users.length).toBeGreaterThan(0);

            // Regular user should not be able to get all users
            const userRes = await request(app)
                .get('/api/users')
                .set('Cookie', userCookies);

            expect(userRes.statusCode).toEqual(403);
        });

        test('Should get user by ID', async () => {
            // User should be able to get their own profile
            const userRes = await request(app)
                .get(`/api/users/${userId}`)
                .set('Cookie', userCookies);

            expect(userRes.statusCode).toEqual(200);
            expect(userRes.body._id).toBe(userId);
            expect(userRes.body.email).toBe(testUser.email);

            // Admin should be able to get any user
            const adminRes = await request(app)
                .get(`/api/users/${userId}`)
                .set('Cookie', adminCookies);

            expect(adminRes.statusCode).toEqual(200);
            expect(adminRes.body._id).toBe(userId);
        });

        test('Should update user profile', async () => {
            const updateData = {
                bio: 'This is a test bio',
                firstName: 'Updated',
                lastName: 'User'
            };

            const res = await request(app)
                .put(`/api/users/${userId}`)
                .set('Cookie', userCookies)
                .send(updateData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.bio).toBe(updateData.bio);
            expect(res.body.firstName).toBe(updateData.firstName);
        });

        test('Should allow admin to update user role', async () => {
            const updateData = {
                role: 'student'
            };

            const res = await request(app)
                .put(`/api/users/${userId}`)
                .set('Cookie', adminCookies)
                .send(updateData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.role).toBe(updateData.role);
        });

        test('Should not allow regular user to update role', async () => {
            const updateData = {
                role: 'admin'
            };

            const res = await request(app)
                .put(`/api/users/${userId}`)
                .set('Cookie', userCookies)
                .send(updateData);

            expect(res.statusCode).toEqual(200);
            // Role should not be updated
            expect(res.body.role).toBe('student');
        });

        test('Should change user password', async () => {
            const passwordData = {
                currentPassword: testUser.password,
                newPassword: 'NewPassword123!'
            };

            const res = await request(app)
                .put(`/api/users/${userId}/password`)
                .set('Cookie', userCookies)
                .send(passwordData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toContain('Password updated successfully');

            // Login with new password
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: passwordData.newPassword
                });

            expect(loginRes.statusCode).toEqual(200);
            userCookies = loginRes.headers['set-cookie'];

            // Change password back for other tests
            const revertPasswordData = {
                currentPassword: passwordData.newPassword,
                newPassword: testUser.password
            };

            const revertRes = await request(app)
                .put(`/api/users/${userId}/password`)
                .set('Cookie', userCookies)
                .send(revertPasswordData);

            expect(revertRes.statusCode).toEqual(200);
        });

        test('Should update notification preferences', async () => {
            const preferences = {
                email: {
                    newComment: false,
                    projectStatus: true
                },
                inApp: {
                    newComment: true,
                    projectStatus: false
                }
            };

            const res = await request(app)
                .put(`/api/users/${userId}/notification-preferences`)
                .set('Cookie', userCookies)
                .send(preferences);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toContain('Notification preferences updated');

            // Verify preferences were updated
            const userRes = await request(app)
                .get(`/api/users/${userId}`)
                .set('Cookie', userCookies);

            expect(userRes.body.notificationPreferences.email.newComment).toBe(false);
            expect(userRes.body.notificationPreferences.email.projectStatus).toBe(true);
            expect(userRes.body.notificationPreferences.inApp.newComment).toBe(true);
            expect(userRes.body.notificationPreferences.inApp.projectStatus).toBe(false);
        });

        // This test is conditional - only runs if we can create a test image
        test('Should upload profile picture if test image exists', async () => {
            // Create a test image path
            const testImagePath = path.join(__dirname, 'test-profile.png');
            let imageExists = false;

            // Check if the image exists or can be created
            try {
                if (fs.existsSync(testImagePath)) {
                    imageExists = true;
                } else {
                    // Skip this test if we can't create a test image
                    console.log('Test image does not exist, skipping profile picture upload test');
                }
            } catch (err) {
                console.error('Error checking for test image:', err);
            }

            if (imageExists) {
                const res = await request(app)
                    .post(`/api/users/${userId}/profile-picture`)
                    .set('Cookie', userCookies)
                    .attach('profileImage', testImagePath);

                expect(res.statusCode).toEqual(200);
                expect(res.body.message).toContain('Profile picture uploaded successfully');
            }
        });
    });
}); 