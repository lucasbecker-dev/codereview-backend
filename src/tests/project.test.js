const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Project = require('../models/Project');
const File = require('../models/File');
const fs = require('fs');
const path = require('path');

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

// Global variables to store tokens and IDs
let studentToken;
let reviewerToken;
let projectId;
let fileId;

// Setup before tests
beforeAll(async () => {
    // Clear test data
    await User.deleteMany({ email: { $in: [testStudent.email, testReviewer.email] } });
    await Project.deleteMany({ title: testProject.title });

    // Register test users
    await request(app)
        .post('/api/auth/register')
        .send(testStudent);

    await request(app)
        .post('/api/auth/register')
        .send(testReviewer);

    // Login to get tokens
    const studentLogin = await request(app)
        .post('/api/auth/login')
        .send({
            email: testStudent.email,
            password: testStudent.password
        });

    studentToken = studentLogin.body.token;

    const reviewerLogin = await request(app)
        .post('/api/auth/login')
        .send({
            email: testReviewer.email,
            password: testReviewer.password
        });

    reviewerToken = reviewerLogin.body.token;
});

// Cleanup after tests
afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $in: [testStudent.email, testReviewer.email] } });
    await Project.deleteMany({ title: testProject.title });

    // Close MongoDB connection
    await mongoose.connection.close();
});

describe('Project API', () => {
    // Test creating a project
    test('Should create a new project', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${studentToken}`)
            .send(testProject);

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(testProject.title);

        // Save project ID for later tests
        projectId = res.body.data._id;
    });

    // Test getting all projects
    test('Should get all projects for the student', async () => {
        const res = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    // Test getting a single project
    test('Should get a single project by ID', async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data._id).toBe(projectId);
    });

    // Test updating a project
    test('Should update a project', async () => {
        const updatedData = {
            title: 'Updated Test Project',
            description: 'This is an updated test project'
        };

        const res = await request(app)
            .put(`/api/projects/${projectId}`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send(updatedData);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(updatedData.title);
    });

    // Test file upload
    test('Should upload a file to a project', async () => {
        // Create a test file
        const testFilePath = path.join(__dirname, 'testfile.js');
        fs.writeFileSync(testFilePath, 'console.log("Hello, World!");');

        const res = await request(app)
            .post(`/api/projects/${projectId}/files`)
            .set('Authorization', `Bearer ${studentToken}`)
            .attach('files', testFilePath);

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Save file ID for later tests
        fileId = res.body.data[0]._id;

        // Clean up test file
        fs.unlinkSync(testFilePath);
    });

    // Test getting project files
    test('Should get all files for a project', async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}/files`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    // Test getting a single file
    test('Should get a single file by ID', async () => {
        const res = await request(app)
            .get(`/api/files/${fileId}`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data._id).toBe(fileId);
    });

    // Test getting raw file content
    test('Should get raw file content', async () => {
        const res = await request(app)
            .get(`/api/files/${fileId}/raw`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Hello, World!');
    });

    // Test updating project status by reviewer
    test('Should update project status by reviewer', async () => {
        // First, assign the reviewer to the project
        const project = await Project.findById(projectId);
        project.reviewers.push(await User.findOne({ email: testReviewer.email }));
        await project.save();

        const res = await request(app)
            .put(`/api/projects/${projectId}/status`)
            .set('Authorization', `Bearer ${reviewerToken}`)
            .send({ status: 'accepted' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('accepted');
    });

    // Test adding feedback by reviewer
    test('Should add feedback to a project by reviewer', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/feedback`)
            .set('Authorization', `Bearer ${reviewerToken}`)
            .send({ text: 'This is test feedback for the project.' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.feedback.text).toBe('This is test feedback for the project.');
    });
}); 