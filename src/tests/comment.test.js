const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Project = require('../models/Project');
const File = require('../models/File');
const Comment = require('../models/Comment');

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

let userCookies;
let reviewerCookies;
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

    // Login as user and reviewer to get cookies
    const userLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
            email: testUser.email,
            password: testUser.password
        });
    userCookies = userLoginResponse.headers['set-cookie'];

    const reviewerLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
            email: testReviewer.email,
            password: testReviewer.password
        });
    reviewerCookies = reviewerLoginResponse.headers['set-cookie'];

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

// Clean up after tests
afterAll(async () => {
    // Clear test data
    await User.deleteMany({ email: { $in: [testUser.email, testReviewer.email] } });
    await Project.deleteMany({ title: testProject.title });
    await File.deleteMany({ filename: testFile.filename });
    await Comment.deleteMany({});

    // Close database connection
    await mongoose.connection.close();
});

describe('Comment API', () => {
    describe('POST /api/comments', () => {
        test('Should create a new comment', async () => {
            const res = await request(app)
                .post('/api/comments')
                .set('Cookie', userCookies)
                .send({
                    projectId,
                    fileId,
                    lineNumber: testComment.lineNumber,
                    text: testComment.text
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.status).toEqual('success');
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.text).toEqual(testComment.text);
            expect(res.body.data.lineNumber).toEqual(testComment.lineNumber);
            expect(res.body.data.author.toString()).toEqual(userId.toString());

            commentId = res.body.data._id;
        });

        test('Should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/comments')
                .set('Cookie', userCookies)
                .send({
                    projectId,
                    fileId,
                    // Missing lineNumber and text
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.status).toEqual('error');
        });

        test('Should return 404 if file not found', async () => {
            const res = await request(app)
                .post('/api/comments')
                .set('Cookie', userCookies)
                .send({
                    projectId,
                    fileId: new mongoose.Types.ObjectId(), // Non-existent file ID
                    lineNumber: testComment.lineNumber,
                    text: testComment.text
                });

            expect(res.statusCode).toEqual(404);
            expect(res.body.status).toEqual('error');
        });
    });

    describe('GET /api/files/:fileId/comments', () => {
        test('Should get all comments for a file', async () => {
            const res = await request(app)
                .get(`/api/files/${fileId}/comments`)
                .set('Cookie', userCookies);

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toEqual('success');
            expect(Array.isArray(res.body.data)).toBeTruthy();
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        test('Should return 404 if file not found', async () => {
            const res = await request(app)
                .get(`/api/files/${new mongoose.Types.ObjectId()}/comments`)
                .set('Cookie', userCookies);

            expect(res.statusCode).toEqual(404);
            expect(res.body.status).toEqual('error');
        });
    });

    describe('GET /api/projects/:projectId/comments', () => {
        test('Should get all comments for a project', async () => {
            const res = await request(app)
                .get(`/api/projects/${projectId}/comments`)
                .set('Cookie', userCookies);

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toEqual('success');
            expect(Array.isArray(res.body.data)).toBeTruthy();
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        test('Should return 404 if project not found', async () => {
            const res = await request(app)
                .get(`/api/projects/${new mongoose.Types.ObjectId()}/comments`)
                .set('Cookie', userCookies);

            expect(res.statusCode).toEqual(404);
            expect(res.body.status).toEqual('error');
        });
    });

    describe('POST /api/comments/:commentId/replies', () => {
        test('Should add a reply to a comment', async () => {
            const res = await request(app)
                .post(`/api/comments/${commentId}/replies`)
                .set('Cookie', reviewerCookies)
                .send({
                    text: testReply.text
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toEqual('success');
            expect(res.body.data.replies.length).toEqual(1);
            expect(res.body.data.replies[0].text).toEqual(testReply.text);
            expect(res.body.data.replies[0].author.toString()).toEqual(reviewerId.toString());
        });

        test('Should return 400 if reply text is missing', async () => {
            const res = await request(app)
                .post(`/api/comments/${commentId}/replies`)
                .set('Cookie', reviewerCookies)
                .send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body.status).toEqual('error');
        });

        test('Should return 404 if comment not found', async () => {
            const res = await request(app)
                .post(`/api/comments/${new mongoose.Types.ObjectId()}/replies`)
                .set('Cookie', reviewerCookies)
                .send({
                    text: testReply.text
                });

            expect(res.statusCode).toEqual(404);
            expect(res.body.status).toEqual('error');
        });
    });

    describe('DELETE /api/comments/:commentId', () => {
        test('Should delete a comment', async () => {
            // First create a comment to delete
            const createRes = await request(app)
                .post('/api/comments')
                .set('Cookie', userCookies)
                .send({
                    projectId,
                    fileId,
                    lineNumber: 2,
                    text: 'Comment to delete'
                });

            const commentToDeleteId = createRes.body.data._id;

            const res = await request(app)
                .delete(`/api/comments/${commentToDeleteId}`)
                .set('Cookie', userCookies);

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toEqual('success');
            expect(res.body.message).toContain('Comment deleted');
        });

        test('Should return 404 if comment not found', async () => {
            const res = await request(app)
                .delete(`/api/comments/${new mongoose.Types.ObjectId()}`)
                .set('Cookie', userCookies);

            expect(res.statusCode).toEqual(404);
            expect(res.body.status).toEqual('error');
        });

        test('Should return 403 if user is not the author', async () => {
            // Create a comment as the user
            const createRes = await request(app)
                .post('/api/comments')
                .set('Cookie', userCookies)
                .send({
                    projectId,
                    fileId,
                    lineNumber: 3,
                    text: 'Comment for auth test'
                });

            const commentId = createRes.body.data._id;

            // Try to delete as the reviewer
            const res = await request(app)
                .delete(`/api/comments/${commentId}`)
                .set('Cookie', reviewerCookies);

            expect(res.statusCode).toEqual(403);
            expect(res.body.status).toEqual('error');
        });
    });

    describe('DELETE /api/comments/:commentId/replies/:replyId', () => {
        test('Should delete a reply', async () => {
            // First create a comment with a reply
            const createCommentRes = await request(app)
                .post('/api/comments')
                .set('Cookie', userCookies)
                .send({
                    projectId,
                    fileId,
                    lineNumber: 4,
                    text: 'Comment with reply to delete'
                });

            const commentWithReplyId = createCommentRes.body.data._id;

            // Add a reply
            const addReplyRes = await request(app)
                .post(`/api/comments/${commentWithReplyId}/replies`)
                .set('Cookie', reviewerCookies)
                .send({
                    text: 'Reply to delete'
                });

            const replyId = addReplyRes.body.data.replies[0]._id;

            // Delete the reply
            const res = await request(app)
                .delete(`/api/comments/${commentWithReplyId}/replies/${replyId}`)
                .set('Cookie', reviewerCookies);

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toEqual('success');
            expect(res.body.message).toContain('Reply deleted');
        });

        test('Should return 404 if comment not found', async () => {
            const res = await request(app)
                .delete(`/api/comments/${new mongoose.Types.ObjectId()}/replies/${new mongoose.Types.ObjectId()}`)
                .set('Cookie', reviewerCookies);

            expect(res.statusCode).toEqual(404);
            expect(res.body.status).toEqual('error');
        });

        test('Should return 404 if reply not found', async () => {
            const res = await request(app)
                .delete(`/api/comments/${commentId}/replies/${new mongoose.Types.ObjectId()}`)
                .set('Cookie', reviewerCookies);

            expect(res.statusCode).toEqual(404);
            expect(res.body.status).toEqual('error');
        });

        test('Should return 403 if user is not the author of the reply', async () => {
            // Create a comment
            const createCommentRes = await request(app)
                .post('/api/comments')
                .set('Cookie', userCookies)
                .send({
                    projectId,
                    fileId,
                    lineNumber: 5,
                    text: 'Comment with reply for auth test'
                });

            const commentId = createCommentRes.body.data._id;

            // Add a reply as reviewer
            const addReplyRes = await request(app)
                .post(`/api/comments/${commentId}/replies`)
                .set('Cookie', reviewerCookies)
                .send({
                    text: 'Reply for auth test'
                });

            const replyId = addReplyRes.body.data.replies[0]._id;

            // Try to delete as user (not the author of the reply)
            const res = await request(app)
                .delete(`/api/comments/${commentId}/replies/${replyId}`)
                .set('Cookie', userCookies);

            expect(res.statusCode).toEqual(403);
            expect(res.body.status).toEqual('error');
        });
    });
}); 