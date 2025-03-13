require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const File = require('../models/File');
const Comment = require('../models/Comment');
const connectDB = require('../config/db');

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

// Test data
const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    password: 'Password123!',
    role: 'student'
};

const testReviewer = {
    firstName: 'Test',
    lastName: 'Reviewer',
    email: 'testreviewer@example.com',
    password: 'Password123!',
    role: 'reviewer'
};

const testProject = {
    title: 'Test Project',
    description: 'This is a test project'
};

const testFile = {
    filename: 'test.js',
    path: '/test/test.js',
    content: 'console.log("Hello, World!");',
    fileType: 'javascript',
    language: 'javascript'
};

const testComment = {
    lineNumber: 1,
    text: 'This is a test comment'
};

const testReply = {
    text: 'This is a test reply'
};

// API base URL
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test the comment API
async function testCommentAPI() {
    try {
        // Connect to the database
        await connectDB();
        console.log('Connected to the database');

        // Clear test data
        await User.deleteMany({ email: { $in: [testUser.email, testReviewer.email] } });
        await Project.deleteMany({ title: testProject.title });
        await File.deleteMany({ filename: testFile.filename });
        await Comment.deleteMany({});
        console.log('Cleared test data');

        // Create test user
        const user = await User.create({
            ...testUser,
            isVerified: true,
            isActive: true,
            notificationPreferences: {
                email: {
                    newComment: true,
                    projectStatus: true,
                    newAssignment: true,
                    newSubmission: true
                },
                inApp: {
                    newComment: true,
                    projectStatus: true,
                    newAssignment: true,
                    newSubmission: true
                }
            }
        });
        const userId = user._id;
        console.log('Created test user');

        // Login as test user
        const userLoginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('Logged in as test user');

        // Store the cookies for user
        const userCookies = userLoginResponse.headers['set-cookie'];
        const userAxios = axios.create({
            headers: {
                Cookie: userCookies.join('; ')
            }
        });

        // Create test reviewer
        const reviewer = await User.create({
            ...testReviewer,
            isVerified: true,
            isActive: true,
            notificationPreferences: {
                email: {
                    newComment: true,
                    projectStatus: true,
                    newAssignment: true,
                    newSubmission: true
                },
                inApp: {
                    newComment: true,
                    projectStatus: true,
                    newAssignment: true,
                    newSubmission: true
                }
            }
        });
        const reviewerId = reviewer._id;
        console.log('Created test reviewer');

        // Login as reviewer
        const reviewerLoginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: testReviewer.email,
            password: testReviewer.password
        });
        console.log('Logged in as reviewer');

        // Store the cookies for reviewer
        const reviewerCookies = reviewerLoginResponse.headers['set-cookie'];
        const reviewerAxios = axios.create({
            headers: {
                Cookie: reviewerCookies.join('; ')
            }
        });

        // Create test project
        const project = await Project.create({
            ...testProject,
            student: userId,
            reviewers: [reviewerId],
            status: 'pending'
        });
        const projectId = project._id;
        console.log('Created test project');

        // Create test file
        const file = await File.create({
            ...testFile,
            project: projectId
        });
        const fileId = file._id;
        console.log('Created test file');

        // Test creating a comment
        console.log('\nTesting POST /api/comments');
        const createCommentResponse = await userAxios.post(
            `${API_URL}/comments`,
            {
                projectId,
                fileId,
                lineNumber: testComment.lineNumber,
                text: testComment.text
            }
        );
        console.log('Response status:', createCommentResponse.status);
        console.log('Response data:', createCommentResponse.data);

        const commentId = createCommentResponse.data.data._id;

        // Test getting comments for a file
        console.log('\nTesting GET /api/files/:fileId/comments');
        const getFileCommentsResponse = await userAxios.get(
            `${API_URL}/files/${fileId}/comments`
        );
        console.log('Response status:', getFileCommentsResponse.status);
        console.log('Response data:', getFileCommentsResponse.data);

        // Test getting comments for a project
        console.log('\nTesting GET /api/projects/:projectId/comments');
        const getProjectCommentsResponse = await userAxios.get(
            `${API_URL}/projects/${projectId}/comments`
        );
        console.log('Response status:', getProjectCommentsResponse.status);
        console.log('Response data:', getProjectCommentsResponse.data);

        // Test adding a reply to a comment
        console.log('\nTesting POST /api/comments/:commentId/replies');
        const addReplyResponse = await reviewerAxios.post(
            `${API_URL}/comments/${commentId}/replies`,
            {
                text: testReply.text
            }
        );
        console.log('Response status:', addReplyResponse.status);
        console.log('Response data:', addReplyResponse.data);

        const replyId = addReplyResponse.data.data._id;

        // Test creating a comment to delete
        console.log('\nCreating a comment to delete');
        const createCommentToDeleteResponse = await userAxios.post(
            `${API_URL}/comments`,
            {
                projectId,
                fileId,
                lineNumber: 2,
                text: 'Comment to delete'
            }
        );
        const commentToDeleteId = createCommentToDeleteResponse.data.data._id;

        // Test deleting a comment
        console.log('\nTesting DELETE /api/comments/:commentId');
        const deleteCommentResponse = await userAxios.delete(
            `${API_URL}/comments/${commentToDeleteId}`
        );
        console.log('Response status:', deleteCommentResponse.status);
        console.log('Response data:', deleteCommentResponse.data);

        // Test creating a comment with a reply to delete
        console.log('\nCreating a comment with a reply to delete');
        const createCommentWithReplyResponse = await userAxios.post(
            `${API_URL}/comments`,
            {
                projectId,
                fileId,
                lineNumber: 3,
                text: 'Comment with reply to delete'
            }
        );
        const commentWithReplyId = createCommentWithReplyResponse.data.data._id;

        // Add a reply to the comment
        console.log('\nAdding a reply to delete');
        const addReplyToDeleteResponse = await reviewerAxios.post(
            `${API_URL}/comments/${commentWithReplyId}/replies`,
            {
                text: 'Reply to delete'
            }
        );
        const replyToDeleteId = addReplyToDeleteResponse.data.data._id;

        // Test deleting a reply
        console.log('\nTesting DELETE /api/comments/:commentId/replies/:replyId');
        const deleteReplyResponse = await reviewerAxios.delete(
            `${API_URL}/comments/${commentWithReplyId}/replies/${replyToDeleteId}`
        );
        console.log('Response status:', deleteReplyResponse.status);
        console.log('Response data:', deleteReplyResponse.data);

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Error testing comment API:', error.response ? error.response.data : error.message);
    } finally {
        // Disconnect from the database
        await mongoose.connection.close();
        console.log('Disconnected from the database');
    }
}

// Run the tests
testCommentAPI(); 