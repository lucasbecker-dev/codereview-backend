/**
 * Simple script to test the Project and File API endpoints
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

// Configuration
const API_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
    email: 'testuser@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'student'
};

// Test project data
const testProject = {
    title: 'Test Project',
    description: 'This is a test project',
    tags: ['test', 'api']
};

// Global variables
let axiosInstance;
let projectId = '';
let fileId = '';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Verify user directly in the database
const verifyUser = async (email) => {
    try {
        const User = mongoose.model('User');
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found`);
            return false;
        }

        user.isVerified = true;
        await user.save();
        console.log(`User ${email} verified successfully`);
        return true;
    } catch (error) {
        console.error('Error verifying user:', error);
        return false;
    }
};

// Register a user
const register = async () => {
    try {
        console.log('Registering test user...');
        const response = await axios.post(`${API_URL}/auth/register`, testUser);
        console.log('Registration successful:', response.data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data.message === 'User already exists') {
            console.log('User already exists, proceeding...');
            return { success: true };
        }
        console.error('Registration error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Login a user
const login = async () => {
    try {
        console.log('Logging in...');
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('Login successful');

        // Create an axios instance with the cookies
        const cookies = response.headers['set-cookie'];
        const instance = axios.create({
            headers: {
                Cookie: cookies.join('; ')
            }
        });

        return instance;
    } catch (error) {
        console.error('Login error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Create a project
const createProject = async () => {
    try {
        console.log('Creating project...');
        const response = await axiosInstance.post(`${API_URL}/projects`, testProject);
        console.log('Project created:', response.data);
        return response.data.data._id;
    } catch (error) {
        console.error('Create project error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Get all projects
const getProjects = async () => {
    try {
        console.log('Getting all projects...');
        const response = await axiosInstance.get(`${API_URL}/projects`);
        console.log('Projects retrieved:', response.data);
        return response.data;
    } catch (error) {
        console.error('Get projects error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Get a single project
const getProject = async (id) => {
    try {
        console.log(`Getting project ${id}...`);
        const response = await axiosInstance.get(`${API_URL}/projects/${id}`);
        console.log('Project retrieved:', response.data);
        return response.data;
    } catch (error) {
        console.error('Get project error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Update a project
const updateProject = async (id) => {
    try {
        console.log(`Updating project ${id}...`);
        const response = await axiosInstance.put(`${API_URL}/projects/${id}`, {
            title: 'Updated Test Project',
            description: 'This is an updated test project',
            tags: ['updated', 'test', 'api']
        });
        console.log('Project updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Update project error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Create a test file
const createTestFile = () => {
    const testFilePath = path.join(__dirname, 'testfile.js');
    fs.writeFileSync(testFilePath, 'console.log("Hello, World!");');
    return testFilePath;
};

// Upload a file to a project
const uploadFile = async (projectId, filePath) => {
    try {
        console.log(`Uploading file to project ${projectId}...`);
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        const response = await axiosInstance.post(`${API_URL}/projects/${projectId}/files`, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log('File uploaded:', response.data);
        return response.data.data[0]._id;
    } catch (error) {
        console.error('Upload file error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Get all files for a project
const getProjectFiles = async (projectId) => {
    try {
        console.log(`Getting files for project ${projectId}...`);
        const response = await axiosInstance.get(`${API_URL}/projects/${projectId}/files`);
        console.log('Files retrieved:', response.data);
        return response.data;
    } catch (error) {
        console.error('Get project files error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Get a single file
const getFile = async (fileId) => {
    try {
        console.log(`Getting file ${fileId}...`);
        const response = await axiosInstance.get(`${API_URL}/files/${fileId}`);
        console.log('File retrieved:', response.data);
        return response.data;
    } catch (error) {
        console.error('Get file error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Get raw file content
const getRawFileContent = async (fileId) => {
    try {
        console.log(`Getting raw content for file ${fileId}...`);
        const response = await axiosInstance.get(`${API_URL}/files/${fileId}/raw`);
        console.log('Raw content retrieved');
        return response.data;
    } catch (error) {
        console.error('Get raw file content error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Delete a test file
const deleteTestFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Test file deleted');
    }
};

// Disconnect from MongoDB
const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('MongoDB disconnection error:', error);
    }
};

// Run all tests
const runTests = async () => {
    try {
        // Connect to the database
        await connectDB();

        // Register and verify user
        await register();
        await verifyUser(testUser.email);

        // Login to get cookies
        axiosInstance = await login();

        // Create a project
        projectId = await createProject();

        // Get all projects
        await getProjects();

        // Get a single project
        await getProject(projectId);

        // Update a project
        await updateProject(projectId);

        // Create and upload a test file
        const testFilePath = createTestFile();
        fileId = await uploadFile(projectId, testFilePath);

        // Get all files for a project
        await getProjectFiles(projectId);

        // Get a single file
        await getFile(fileId);

        // Get raw file content
        await getRawFileContent(fileId);

        // Clean up
        deleteTestFile(testFilePath);

        // Disconnect from the database
        await disconnectDB();

        console.log('All tests completed successfully!');
    } catch (error) {
        console.error('Test sequence failed:', error);
        await disconnectDB();
    }
};

// Run the tests
runTests(); 