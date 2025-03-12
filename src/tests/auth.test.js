const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User } = require('../models');

// Test user credentials
const testUser = {
    email: 'testuser@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'student'
};

// Store cookies for authenticated requests
let cookies;

describe('Auth API', () => {
    beforeAll(async () => {
        // Clear test data
        await User.deleteMany({ email: testUser.email });
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({ email: testUser.email });

        // Close MongoDB connection
        await mongoose.connection.close();
    });

    // Test user registration
    test('Should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toContain('User registered successfully');
        expect(res.body.user.email).toBe(testUser.email);
    });

    // Test user verification (this would normally require email verification)
    test('Should verify a user for testing', async () => {
        // First get the user ID
        const user = await User.findOne({ email: testUser.email });

        const res = await request(app)
            .post('/api/auth/verify-test')
            .send({ userId: user._id.toString() });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('User verified successfully');
    });

    // Test user login
    test('Should login a user and set cookie', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toBe(testUser.email);

        // Check that we received a cookie
        expect(res.headers['set-cookie']).toBeDefined();
        cookies = res.headers['set-cookie'];
    });

    // Test getting user profile with cookie auth
    test('Should get user profile with cookie auth', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', cookies);

        expect(res.statusCode).toEqual(200);
        expect(res.body.email).toBe(testUser.email);
    });

    // Test logout
    test('Should logout a user and clear cookie', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', cookies);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('Logged out successfully');

        // Check that the cookie was cleared
        expect(res.headers['set-cookie'][0]).toContain('auth_token=;');
    });

    // Test accessing protected route after logout
    test('Should not access protected route after logout', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', cookies);

        expect(res.statusCode).toEqual(401);
    });

    // Test validation errors
    test('Should return validation errors for invalid registration data', async () => {
        const invalidUser = {
            email: 'invalid-email',
            password: 'short',
            firstName: '',
            lastName: ''
        };

        const res = await request(app)
            .post('/api/auth/register')
            .send(invalidUser);

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('Validation error');
        expect(res.body.errors).toBeDefined();
        expect(res.body.errors.length).toBeGreaterThan(0);
    });
}); 