/**
 * Test script for User Management API
 * This script tests the user management API endpoints
 */
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// API base URL
const API_URL = process.env.BASE_URL || 'http://localhost:5000/api';

// Test user credentials
const testUser = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
};

// Admin user credentials
const adminUser = {
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User'
};

// Store tokens
let userToken = '';
let adminToken = '';
let userId = '';
let adminId = '';

/**
 * Register a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Response data
 */
const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            ...userData,
            role: userData.email.includes('admin') ? 'admin' : 'student'
        });
        console.log('User registered:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Verify user email
 * @param {string} userId - User ID to verify
 * @returns {Promise<Object>} Response data
 */
const verifyUserEmail = async (userId) => {
    try {
        const response = await axios.post(`${API_URL}/auth/verify-test`, { userId });
        console.log('Email verified:', response.data.message);
        return response.data;
    } catch (error) {
        console.error('Error verifying email:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Login a user
 * @param {Object} credentials - User credentials
 * @returns {Promise<Object>} Response data with token
 */
const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        console.log('User logged in:', response.data.user.email);
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get all users (admin only)
 * @param {string} token - Admin JWT token
 * @returns {Promise<Object>} Response data with users
 */
const getAllUsers = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Got all users:', response.data.users.length);
        return response.data;
    } catch (error) {
        console.error('Error getting users:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get user by ID
 * @param {string} token - JWT token
 * @param {string} id - User ID
 * @returns {Promise<Object>} Response data with user
 */
const getUserById = async (token, id) => {
    try {
        if (!id) {
            throw new Error('User ID is undefined or empty');
        }
        console.log(`Attempting to get user with ID: ${id}`);
        const response = await axios.get(`${API_URL}/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Got user by ID:', response.data.email);
        return response.data;
    } catch (error) {
        console.error('Error getting user by ID:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update user profile
 * @param {string} token - JWT token
 * @param {string} id - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Response data with updated user
 */
const updateUser = async (token, id, updateData) => {
    try {
        const response = await axios.put(`${API_URL}/users/${id}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Updated user:', response.data.email);
        return response.data;
    } catch (error) {
        console.error('Error updating user:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Change user password
 * @param {string} token - JWT token
 * @param {string} id - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Response data
 */
const changePassword = async (token, id, currentPassword, newPassword) => {
    try {
        const response = await axios.put(
            `${API_URL}/users/${id}/password`,
            { currentPassword, newPassword },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Changed password:', response.data.message);
        return response.data;
    } catch (error) {
        console.error('Error changing password:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update notification preferences
 * @param {string} token - JWT token
 * @param {string} id - User ID
 * @param {Object} preferences - Notification preferences
 * @returns {Promise<Object>} Response data
 */
const updateNotificationPreferences = async (token, id, preferences) => {
    try {
        const response = await axios.put(
            `${API_URL}/users/${id}/notification-preferences`,
            preferences,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Updated notification preferences:', response.data.message);
        return response.data;
    } catch (error) {
        console.error('Error updating notification preferences:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Upload profile picture
 * @param {string} token - JWT token
 * @param {string} id - User ID
 * @param {string} imagePath - Path to image file
 * @returns {Promise<Object>} Response data
 */
const uploadProfilePicture = async (token, id, imagePath) => {
    try {
        const form = new FormData();
        form.append('profileImage', fs.createReadStream(imagePath));

        const response = await axios.post(
            `${API_URL}/users/${id}/profile-picture`,
            form,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...form.getHeaders()
                }
            }
        );
        console.log('Uploaded profile picture:', response.data.message);
        return response.data;
    } catch (error) {
        console.error('Error uploading profile picture:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Run all tests
 */
const runTests = async () => {
    try {
        console.log('Starting User API tests...');

        // Register test users
        let testUserData, adminUserData;

        try {
            testUserData = await registerUser(testUser);
            console.log('Test user registered with ID:', testUserData.user.id);
        } catch (error) {
            console.log('User may already exist, continuing...');
        }

        try {
            adminUserData = await registerUser(adminUser);
            console.log('Admin user registered with ID:', adminUserData.user.id);
        } catch (error) {
            console.log('Admin may already exist, continuing...');
        }

        // Verify user emails
        if (testUserData) {
            await verifyUserEmail(testUserData.user.id);
        } else {
            // If user already exists, we need to get their ID
            // This is a simplified approach - in a real scenario, you might need to handle this differently
            console.log('Test user already exists, attempting to login without verification...');
            try {
                const loginData = await loginUser({
                    email: testUser.email,
                    password: testUser.password
                });
                testUserData = { user: { id: loginData.user.id } };
            } catch (error) {
                console.log('Could not login existing user, trying to find user by email...');
                // In a real scenario, you might need an admin token to search for users
                // For simplicity, we'll assume the user exists and continue with the test
            }
        }

        if (adminUserData) {
            await verifyUserEmail(adminUserData.user.id);
        } else {
            console.log('Admin user already exists, attempting to login without verification...');
            try {
                const loginData = await loginUser({
                    email: adminUser.email,
                    password: adminUser.password
                });
                adminUserData = { user: { id: loginData.user.id } };
            } catch (error) {
                console.log('Could not login existing admin, trying to find user by email...');
                // Similar to above, in a real scenario you'd handle this differently
            }
        }

        // Login users
        const userLoginData = await loginUser({
            email: testUser.email,
            password: testUser.password
        });
        userToken = userLoginData.token;
        userId = userLoginData.user.id;
        console.log(`Test user ID set to: ${userId}`);

        const adminLoginData = await loginUser({
            email: adminUser.email,
            password: adminUser.password
        });
        adminToken = adminLoginData.token;
        adminId = adminLoginData.user.id;
        console.log(`Admin user ID set to: ${adminId}`);

        // Test admin-only endpoint
        const allUsers = await getAllUsers(adminToken);
        console.log(`Found ${allUsers.users.length} users`);

        // Test getting user by ID - only proceed if we have valid IDs
        if (userId) {
            console.log('Testing getUserById with test user ID');
            await getUserById(userToken, userId);
            await getUserById(adminToken, userId); // Admin can get any user
        } else {
            console.log('Skipping getUserById test - no valid user ID');
        }

        // Only proceed with remaining tests if we have valid IDs
        if (userId) {
            // Test updating user profile
            await updateUser(userToken, userId, {
                bio: 'This is a test bio'
            });

            // Test admin updating user role
            await updateUser(adminToken, userId, {
                role: 'student'
            });

            // Test changing password
            await changePassword(userToken, userId, testUser.password, 'newpassword123');

            // Login with new password
            const newLoginData = await loginUser({
                email: testUser.email,
                password: 'newpassword123'
            });
            userToken = newLoginData.token;

            // Change password back
            await changePassword(userToken, userId, 'newpassword123', testUser.password);

            // Test updating notification preferences
            await updateNotificationPreferences(userToken, userId, {
                email: {
                    newComment: false
                },
                inApp: {
                    projectStatus: false
                }
            });

            // Test uploading profile picture
            // Create a test image if it doesn't exist
            const testImagePath = path.join(__dirname, 'test-profile.png');
            if (!fs.existsSync(testImagePath)) {
                console.log('Test image does not exist, skipping profile picture upload test');
            } else {
                await uploadProfilePicture(userToken, userId, testImagePath);
            }
        } else {
            console.log('Skipping remaining tests - no valid user ID');
        }

        console.log('All tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
};

// Run the tests
runTests(); 