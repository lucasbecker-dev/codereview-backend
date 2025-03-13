/**
 * Test script for User Management API
 * This script tests the user management API endpoints
 */
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

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

// Store axios instances with cookies
let userAxios;
let adminAxios;
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
 * @returns {Promise<Object>} Response data with axios instance
 */
const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        console.log('User logged in:', response.data.user.email);

        // Create an axios instance with the cookies
        const cookies = response.headers['set-cookie'];
        const axiosInstance = axios.create({
            headers: {
                Cookie: cookies.join('; ')
            }
        });

        return {
            data: response.data,
            axiosInstance
        };
    } catch (error) {
        console.error('Error logging in:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get all users (admin only)
 * @param {Object} axiosInstance - Axios instance with admin cookies
 * @returns {Promise<Object>} Response data with users
 */
const getAllUsers = async (axiosInstance) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users`);
        console.log('Got all users:', response.data.users.length);
        return response.data;
    } catch (error) {
        console.error('Error getting users:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get user by ID
 * @param {Object} axiosInstance - Axios instance with cookies
 * @param {string} id - User ID
 * @returns {Promise<Object>} Response data with user
 */
const getUserById = async (axiosInstance, id) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users/${id}`);
        console.log('Got user by ID:', response.data.user.email);
        return response.data;
    } catch (error) {
        console.error('Error getting user by ID:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update user
 * @param {Object} axiosInstance - Axios instance with cookies
 * @param {string} id - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Response data with updated user
 */
const updateUser = async (axiosInstance, id, updateData) => {
    try {
        const response = await axiosInstance.put(`${API_URL}/users/${id}`, updateData);
        console.log('Updated user:', response.data.user.email);
        return response.data;
    } catch (error) {
        console.error('Error updating user:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update user profile picture
 * @param {Object} axiosInstance - Axios instance with cookies
 * @param {string} id - User ID
 * @param {string} imagePath - Path to image file
 * @returns {Promise<Object>} Response data with updated user
 */
const updateProfilePicture = async (axiosInstance, id, imagePath) => {
    try {
        const form = new FormData();
        form.append('profilePicture', fs.createReadStream(imagePath));

        const response = await axiosInstance.put(`${API_URL}/users/${id}/profile-picture`, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log('Updated profile picture for user:', response.data.user.email);
        return response.data;
    } catch (error) {
        console.error('Error updating profile picture:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Delete user
 * @param {Object} axiosInstance - Axios instance with admin cookies
 * @param {string} id - User ID to delete
 * @returns {Promise<Object>} Response data
 */
const deleteUser = async (axiosInstance, id) => {
    try {
        const response = await axiosInstance.delete(`${API_URL}/users/${id}`);
        console.log('Deleted user:', id);
        return response.data;
    } catch (error) {
        console.error('Error deleting user:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Run all tests
 */
const runTests = async () => {
    try {
        console.log('Starting User API tests...');

        // Register users
        const userRegisterResponse = await registerUser(testUser);
        userId = userRegisterResponse.user._id;

        const adminRegisterResponse = await registerUser(adminUser);
        adminId = adminRegisterResponse.user._id;

        // Verify emails
        await verifyUserEmail(userId);
        await verifyUserEmail(adminId);

        // Login users
        const userLoginResponse = await loginUser({
            email: testUser.email,
            password: testUser.password
        });
        userAxios = userLoginResponse.axiosInstance;

        const adminLoginResponse = await loginUser({
            email: adminUser.email,
            password: adminUser.password
        });
        adminAxios = adminLoginResponse.axiosInstance;

        // Test admin endpoints
        await getAllUsers(adminAxios);

        // Test user endpoints
        await getUserById(userAxios, userId);

        // Update user
        await updateUser(userAxios, userId, {
            firstName: 'Updated',
            lastName: 'Name'
        });

        // Create a test image for profile picture
        const testImagePath = path.join(__dirname, 'test-profile.png');
        // Create a simple 1x1 pixel PNG
        fs.writeFileSync(testImagePath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));

        // Update profile picture
        await updateProfilePicture(userAxios, userId, testImagePath);

        // Clean up test image
        fs.unlinkSync(testImagePath);

        // Delete user (admin only)
        await deleteUser(adminAxios, userId);

        console.log('All User API tests completed successfully!');
    } catch (error) {
        console.error('Test sequence failed:', error.message);
    }
};

// Run the tests
runTests(); 