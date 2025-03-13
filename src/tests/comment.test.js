const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Project = require('../models/Project');
const File = require('../models/File');
const Comment = require('../models/Comment');
const { generateToken } = require('../utils/tokenGenerator');

// Mock the notification service
jest.mock('../services/notification.service', () => ({
    createNotification: jest.fn().mockResolvedValue({ _id: 'mock-notification-id' })
}));

// Test user data
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

// Test project data
const testProject = {
    title: 'Test Project',
    description: 'This is a test project'
};

// Test file data
const testFile = {
    filename: 'test.js',
    path: '/test/test.js',
    content: 'console.log("Hello, World!");',
    fileType: 'javascript',
    language: 'javascript'
};

// Test comment data
const testComment = {
    lineNumber: 1,
    text: 'This is a test comment'
};

// Test reply data
const testReply = {
    text: 'This is a test reply'
};

let authToken;
let reviewerToken;
let userId;
let reviewerId;
let projectId;
let fileId;
let commentId;

// Connect to the database before tests
beforeAll(async () => {
    // Clear test data
    await User.deleteMany({ email: { $in: [testUser.email, testReviewer.email] } });
    await Project.deleteMany({ title: testProject.title });
    await File.deleteMany({ filename: testFile.filename });
    await Comment.deleteMany({});

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
    userId = user._id;
    authToken = generateToken(userId);

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
    reviewerId = reviewer._id;
    reviewerToken = generateToken(reviewerId);

    // Create test project
    const project = await Project.create({
        ...testProject,
        student: userId,
        reviewers: [reviewerId],
        status: 'pending'
    });
    projectId = project._id;

    // Create test file
    const file = await File.create({
        ...testFile,
        project: projectId
    });
    fileId = file._id;
});

// Disconnect from the database after tests
afterAll(async () => {
    await mongoose.connection.close();
});

describe('Comment API', () => {
    describe('POST /api/comments', () => {
        it('should create a new comment', async () => {
            const res = await request(app)
                .post('/api/comments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    projectId,
                    fileId,
                    lineNumber: testComment.lineNumber,
                    text: testComment.text
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.text).toEqual(testComment.text);
            expect(res.body.data.lineNumber).toEqual(testComment.lineNumber);
            expect(res.body.data.author).toHaveProperty('_id');
            expect(res.body.data.author).toHaveProperty('firstName');
            expect(res.body.data.author).toHaveProperty('lastName');

            // Save comment ID for later tests
            commentId = res.body.data._id;
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/comments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    projectId,
                    fileId,
                    // Missing lineNumber and text
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 404 if project does not exist', async () => {
            const res = await request(app)
                .post('/api/comments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    projectId: new mongoose.Types.ObjectId(), // Non-existent project ID
                    fileId,
                    lineNumber: testComment.lineNumber,
                    text: testComment.text
                });

            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });

        it('should return 404 if file does not exist', async () => {
            const res = await request(app)
                .post('/api/comments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    projectId,
                    fileId: new mongoose.Types.ObjectId(), // Non-existent file ID
                    lineNumber: testComment.lineNumber,
                    text: testComment.text
                });

            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/files/:fileId/comments', () => {
        it('should get all comments for a file', async () => {
            const res = await request(app)
                .get(`/api/files/${fileId}/comments`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data[0]).toHaveProperty('_id');
            expect(res.body.data[0]).toHaveProperty('text');
            expect(res.body.data[0]).toHaveProperty('lineNumber');
            expect(res.body.data[0]).toHaveProperty('author');
        });

        it('should return 404 if file does not exist', async () => {
            const res = await request(app)
                .get(`/api/files/${new mongoose.Types.ObjectId()}/comments`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/projects/:projectId/comments', () => {
        it('should get all comments for a project', async () => {
            const res = await request(app)
                .get(`/api/projects/${projectId}/comments`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data[0]).toHaveProperty('_id');
            expect(res.body.data[0]).toHaveProperty('text');
            expect(res.body.data[0]).toHaveProperty('lineNumber');
            expect(res.body.data[0]).toHaveProperty('author');
            expect(res.body.data[0]).toHaveProperty('file');
        });

        it('should return 404 if project does not exist', async () => {
            const res = await request(app)
                .get(`/api/projects/${new mongoose.Types.ObjectId()}/comments`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/comments/:commentId/replies', () => {
        it('should add a reply to a comment', async () => {
            const res = await request(app)
                .post(`/api/comments/${commentId}/replies`)
                .set('Authorization', `Bearer ${reviewerToken}`)
                .send({
                    text: testReply.text
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data).toHaveProperty('text');
            expect(res.body.data.text).toEqual(testReply.text);
            expect(res.body.data).toHaveProperty('author');
        });

        it('should return 400 if reply text is missing', async () => {
            const res = await request(app)
                .post(`/api/comments/${commentId}/replies`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    // Missing text
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 404 if comment does not exist', async () => {
            const res = await request(app)
                .post(`/api/comments/${new mongoose.Types.ObjectId()}/replies`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    text: testReply.text
                });

            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('DELETE /api/comments/:commentId', () => {
        it('should delete a comment', async () => {
            // First create a comment to delete
            const createRes = await request(app)
                .post('/api/comments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    projectId,
                    fileId,
                    lineNumber: 2,
                    text: 'Comment to delete'
                });

            const commentToDeleteId = createRes.body.data._id;

            const res = await request(app)
                .delete(`/api/comments/${commentToDeleteId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            // Verify comment is deleted
            const checkRes = await Comment.findById(commentToDeleteId);
            expect(checkRes).toBeNull();
        });

        it('should return 404 if comment does not exist', async () => {
            const res = await request(app)
                .delete(`/api/comments/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });

        it('should return 401 if user is not the author', async () => {
            // First create a comment as the student
            const createRes = await request(app)
                .post('/api/comments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    projectId,
                    fileId,
                    lineNumber: 3,
                    text: 'Comment by student'
                });

            const commentId = createRes.body.data._id;

            // Try to delete as the reviewer
            const res = await request(app)
                .delete(`/api/comments/${commentId}`)
                .set('Authorization', `Bearer ${reviewerToken}`);

            expect(res.statusCode).toEqual(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('DELETE /api/comments/:commentId/replies/:replyId', () => {
        it('should delete a reply', async () => {
            // First create a comment
            const createCommentRes = await request(app)
                .post('/api/comments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    projectId,
                    fileId,
                    lineNumber: 4,
                    text: 'Comment with reply'
                });

            const commentWithReplyId = createCommentRes.body.data._id;

            // Add a reply
            const addReplyRes = await request(app)
                .post(`/api/comments/${commentWithReplyId}/replies`)
                .set('Authorization', `Bearer ${reviewerToken}`)
                .send({
                    text: 'Reply to delete'
                });

            const replyId = addReplyRes.body.data._id;

            // Delete the reply
            const res = await request(app)
                .delete(`/api/comments/${commentWithReplyId}/replies/${replyId}`)
                .set('Authorization', `Bearer ${reviewerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            // Verify reply is deleted
            const checkRes = await Comment.findById(commentWithReplyId);
            const replyExists = checkRes.replies.some(reply => reply._id.toString() === replyId);
            expect(replyExists).toBe(false);
        });

        it('should return 404 if comment does not exist', async () => {
            const res = await request(app)
                .delete(`/api/comments/${new mongoose.Types.ObjectId()}/replies/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });

        it('should return 404 if reply does not exist', async () => {
            // First create a comment
            const createCommentRes = await request(app)
                .post('/api/comments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    projectId,
                    fileId,
                    lineNumber: 5,
                    text: 'Comment without reply'
                });

            const commentId = createCommentRes.body.data._id;

            // Try to delete a non-existent reply
            const res = await request(app)
                .delete(`/api/comments/${commentId}/replies/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });
    });
}); 