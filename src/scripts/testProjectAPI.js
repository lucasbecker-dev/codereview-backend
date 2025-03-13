/**
 * Test script for Project and File API
 * This script tests the basic functionality of the Project and File API endpoints
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let studentAxios;
let reviewerAxios;
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

        // Create an axios instance with the cookies
        const cookies = response.headers['set-cookie'];
        const axiosInstance = axios.create({
            headers: {
                Cookie: cookies.join('; ')
            }
        });

        return axiosInstance;
    } catch (error) {
        console.error('Error logging in:', error.response ? error.response.data : error.message);
    }
};

// Create a project
const createProject = async (axiosInstance, projectData) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/projects`, projectData);
        console.log(`Created project: ${projectData.title}`);
        return response.data.data;
    } catch (error) {
        console.error('Error creating project:', error.response ? error.response.data : error.message);
    }
};

// Get all projects
const getProjects = async (axiosInstance) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/projects`);
        console.log(`Retrieved ${response.data.count} projects`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting projects:', error.response ? error.response.data : error.message);
    }
};

// Get a single project
const getProject = async (axiosInstance, id) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/projects/${id}`);
        console.log(`Retrieved project: ${response.data.data.title}`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting project:', error.response ? error.response.data : error.message);
    }
};

// Update a project
const updateProject = async (axiosInstance, id, updateData) => {
    try {
        const response = await axiosInstance.put(`${API_URL}/projects/${id}`, updateData);
        console.log(`Updated project: ${response.data.data.title}`);
        return response.data.data;
    } catch (error) {
        console.error('Error updating project:', error.response ? error.response.data : error.message);
    }
};

// Upload a file to a project
const uploadFile = async (axiosInstance, projectId, filePath) => {
    try {
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        const response = await axiosInstance.post(`${API_URL}/projects/${projectId}/files`, form, {
            headers: {
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
const getProjectFiles = async (axiosInstance, projectId) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/projects/${projectId}/files`);
        console.log(`Retrieved ${response.data.count} files for project ${projectId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting project files:', error.response ? error.response.data : error.message);
    }
};

// Get a single file
const getFile = async (axiosInstance, fileId) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/files/${fileId}`);
        console.log(`Retrieved file: ${response.data.data.filename}`);
        return response.data.data;
    } catch (error) {
        console.error('Error getting file:', error.response ? error.response.data : error.message);
    }
};

// Get raw file content
const getRawFileContent = async (axiosInstance, fileId) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/files/${fileId}/raw`);
        console.log(`Retrieved raw content for file ${fileId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting raw file content:', error.response ? error.response.data : error.message);
    }
};

// Update project status
const updateProjectStatus = async (axiosInstance, projectId, status) => {
    try {
        const response = await axiosInstance.put(`${API_URL}/projects/${projectId}/status`, { status });
        console.log(`Updated project status to: ${status}`);
        return response.data.data;
    } catch (error) {
        console.error('Error updating project status:', error.response ? error.response.data : error.message);
    }
};

// Delete a project
const deleteProject = async (axiosInstance, projectId) => {
    try {
        const response = await axiosInstance.delete(`${API_URL}/projects/${projectId}`);
        console.log(`Deleted project: ${projectId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting project:', error.response ? error.response.data : error.message);
    }
};

// Main test function
const testProjectAPI = async () => {
    try {
        console.log('Starting Project API tests...');

        // Register test users
        await registerUser(testStudent);
        await registerUser(testReviewer);

        // Login as student and reviewer
        studentAxios = await loginUser(testStudent.email, testStudent.password);
        reviewerAxios = await loginUser(testReviewer.email, testReviewer.password);

        if (!studentAxios || !reviewerAxios) {
            console.error('Failed to login. Exiting tests.');
            return;
        }

        // Create a test project
        const project = await createProject(studentAxios, testProject);
        if (!project) {
            console.error('Failed to create project. Exiting tests.');
            return;
        }
        projectId = project._id;

        // Get all projects
        await getProjects(studentAxios);

        // Get the specific project
        await getProject(studentAxios, projectId);

        // Update the project
        await updateProject(studentAxios, projectId, {
            description: 'Updated test project description'
        });

        // Create a test file to upload
        const testFilePath = createTestFile();

        // Upload the file to the project
        const files = await uploadFile(studentAxios, projectId, testFilePath);
        if (files && files.length > 0) {
            fileId = files[0]._id;

            // Get all files for the project
            await getProjectFiles(studentAxios, projectId);

            // Get the specific file
            await getFile(studentAxios, fileId);

            // Get the raw file content
            await getRawFileContent(studentAxios, fileId);
        }

        // Update project status (as reviewer)
        await updateProjectStatus(reviewerAxios, projectId, 'in_review');

        // Clean up
        await deleteProject(studentAxios, projectId);
        deleteTestFile(testFilePath);

        console.log('Project API tests completed successfully!');
    } catch (error) {
        console.error('Error in test sequence:', error.message);
    }
};

// Run the tests
testProjectAPI(); 