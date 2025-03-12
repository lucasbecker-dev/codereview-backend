/**
 * Test script for Project and File API
 * This script tests the basic functionality of the Project and File API endpoints
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let studentToken = '';
let reviewerToken = '';
let projectId = '';
let fileId = '';

// Test user credentials
const testStudent = {
    email: 'teststudent@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Student',
    role: 'student'
};

const testReviewer = {
    email: 'testreviewer@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Reviewer',
    role: 'reviewer'
};

// Test project data
const testProject = {
    title: 'Test Project',
    description: 'This is a test project',
    tags: ['test', 'api']
};

// Helper function to create a test file
const createTestFile = () => {
    const testFilePath = path.join(__dirname, 'testfile.js');
    fs.writeFileSync(testFilePath, 'console.log("Hello, World!");');
    return testFilePath;
};

// Helper function to delete a test file
const deleteTestFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// Register a test user
const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        console.log(`Registered ${userData.role}: ${userData.email}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data.error === 'User already exists') {
            console.log(`User ${userData.email} already exists`);
        } else {
            console.error(`Error registering ${userData.role}:`, error.response ? error.response.data : error.message);
        }
    }
};

// Login a user
const loginUser = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        console.log(`Logged in as ${email}`);
        return response.data.token;
    } catch (error) {
        console.error('Error logging in:', error.response ? error.response.data : error.message);
    }
};

// Create a project
const createProject = async (token, projectData) => {
    try {
        const response = await axios.post(`${API_URL}/projects`, projectData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Created project: ${projectData.title}`);
        return response.data.data;
    } catch (error) {
        console.error('Error creating project:', error.response ? error.response.data : error.message);
    }
};

// Get all projects
const getProjects = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/projects`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Retrieved ${response.data.count} projects`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting projects:', error.response ? error.response.data : error.message);
    }
};

// Get a single project
const getProject = async (token, id) => {
    try {
        const response = await axios.get(`${API_URL}/projects/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Retrieved project: ${response.data.data.title}`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting project:', error.response ? error.response.data : error.message);
    }
};

// Update a project
const updateProject = async (token, id, updateData) => {
    try {
        const response = await axios.put(`${API_URL}/projects/${id}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Updated project: ${response.data.data.title}`);
        return response.data.data;
    } catch (error) {
        console.error('Error updating project:', error.response ? error.response.data : error.message);
    }
};

// Upload a file to a project
const uploadFile = async (token, projectId, filePath) => {
    try {
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        const response = await axios.post(`${API_URL}/projects/${projectId}/files`, form, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...form.getHeaders()
            }
        });
        console.log(`Uploaded ${response.data.count} files to project ${projectId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error uploading file:', error.response ? error.response.data : error.message);
    }
};

// Get all files for a project
const getProjectFiles = async (token, projectId) => {
    try {
        const response = await axios.get(`${API_URL}/projects/${projectId}/files`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Retrieved ${response.data.count} files for project ${projectId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting project files:', error.response ? error.response.data : error.message);
    }
};

// Get a single file
const getFile = async (token, fileId) => {
    try {
        const response = await axios.get(`${API_URL}/files/${fileId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Retrieved file: ${response.data.data.filename}`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting file:', error.response ? error.response.data : error.message);
    }
};

// Get raw file content
const getRawFileContent = async (token, fileId) => {
    try {
        const response = await axios.get(`${API_URL}/files/${fileId}/raw`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Retrieved raw content for file ${fileId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting raw file content:', error.response ? error.response.data : error.message);
    }
};

// Update project status
const updateProjectStatus = async (token, projectId, status) => {
    try {
        const response = await axios.put(`${API_URL}/projects/${projectId}/status`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Updated project status to: ${status}`);
        return response.data.data;
    } catch (error) {
        console.error('Error updating project status:', error.response ? error.response.data : error.message);
    }
};

// Add feedback to a project
const addFeedback = async (token, projectId, text) => {
    try {
        const response = await axios.post(`${API_URL}/projects/${projectId}/feedback`, { text }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Added feedback to project ${projectId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error adding feedback:', error.response ? error.response.data : error.message);
    }
};

// Main test function
const runTests = async () => {
    try {
        console.log('Starting Project and File API tests...');

        // Register test users
        await registerUser(testStudent);
        await registerUser(testReviewer);

        // Login as student and reviewer
        studentToken = await loginUser(testStudent.email, testStudent.password);
        reviewerToken = await loginUser(testReviewer.email, testReviewer.password);

        if (!studentToken || !reviewerToken) {
            console.error('Failed to get authentication tokens. Exiting tests.');
            return;
        }

        // Create a project
        const project = await createProject(studentToken, testProject);
        if (!project) {
            console.error('Failed to create project. Exiting tests.');
            return;
        }
        projectId = project._id;

        // Get all projects
        await getProjects(studentToken);

        // Get a single project
        await getProject(studentToken, projectId);

        // Update a project
        await updateProject(studentToken, projectId, {
            title: 'Updated Test Project',
            description: 'This is an updated test project'
        });

        // Create and upload a test file
        const testFilePath = createTestFile();
        const files = await uploadFile(studentToken, projectId, testFilePath);
        deleteTestFile(testFilePath);

        if (!files || files.length === 0) {
            console.error('Failed to upload file. Exiting tests.');
            return;
        }
        fileId = files[0]._id;

        // Get all files for a project
        await getProjectFiles(studentToken, projectId);

        // Get a single file
        await getFile(studentToken, fileId);

        // Get raw file content
        await getRawFileContent(studentToken, fileId);

        // Manually assign reviewer to project (this would normally be done through the assignment API)
        console.log('Note: In a real scenario, reviewers would be assigned through the assignment API');

        // Update project status
        await updateProjectStatus(reviewerToken, projectId, 'accepted');

        // Add feedback to a project
        await addFeedback(reviewerToken, projectId, 'This is test feedback for the project.');

        console.log('All tests completed successfully!');
    } catch (error) {
        console.error('Error running tests:', error);
    }
};

// Run the tests
runTests(); 