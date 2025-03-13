const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Cohort = require('../models/Cohort');
const Project = require('../models/Project');
const Assignment = require('../models/Assignment');

// Test user credentials
const testAdmin = {
    email: 'testadmin_assignment@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin'
};

const testReviewer = {
    email: 'testreviewer_assignment@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Reviewer',
    role: 'reviewer'
};

const testStudent = {
    email: 'teststudent_assignment@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Student',
    role: 'student'
};

// Test cohort data
const testCohort = {
    name: 'Test Assignment Cohort',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-06-30')
};

// Test project data
const testProject = {
    title: 'Test Assignment Project',
    description: 'This is a test project for assignments',
    tags: ['test', 'assignment']
};

// Global variables to store cookies and IDs
let adminCookies;
let reviewerCookies;
let studentCookies;
let adminId;
let reviewerId;
let studentId;
let cohortId;
let projectId;
let assignmentId;

// Setup before tests
beforeAll(async () => {
    try {
        // Clear test data
        await User.deleteMany({
            email: {
                $in: [testAdmin.email, testReviewer.email, testStudent.email]
            }
        });
        await Cohort.deleteMany({ name: testCohort.name });
        await Project.deleteMany({ title: testProject.title });
        await Assignment.deleteMany({});

        // Register test users
        const adminResponse = await request(app)
            .post('/api/auth/register')
            .send(testAdmin);

        const reviewerResponse = await request(app)
            .post('/api/auth/register')
            .send(testReviewer);

        const studentResponse = await request(app)
            .post('/api/auth/register')
            .send(testStudent);

        adminId = adminResponse.body.user._id;
        reviewerId = reviewerResponse.body.user._id;
        studentId = studentResponse.body.user._id;

        // Login test users to get cookies
        const adminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testAdmin.email,
                password: testAdmin.password
            });

        const reviewerLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testReviewer.email,
                password: testReviewer.password
            });

        const studentLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testStudent.email,
                password: testStudent.password
            });

        adminCookies = adminLoginResponse.headers['set-cookie'];
        reviewerCookies = reviewerLoginResponse.headers['set-cookie'];
        studentCookies = studentLoginResponse.headers['set-cookie'];

        // Create test cohort
        const cohortResponse = await request(app)
            .post('/api/cohorts')
            .set('Cookie', adminCookies)
            .send(testCohort);

        cohortId = cohortResponse.body.data._id;

        // Create test project
        const projectResponse = await request(app)
            .post('/api/projects')
            .set('Cookie', studentCookies)
            .send(testProject);

        projectId = projectResponse.body.data._id;
    } catch (error) {
        console.error('Setup error:', error);
    }
});

// Clean up after tests
afterAll(async () => {
    try {
        // Clean up test data
        await User.deleteMany({
            email: {
                $in: [testAdmin.email, testReviewer.email, testStudent.email]
            }
        });
        await Cohort.deleteMany({ name: testCohort.name });
        await Project.deleteMany({ title: testProject.title });
        await Assignment.deleteMany({});

        // Close MongoDB connection
        await mongoose.connection.close();
    } catch (error) {
        console.error('Cleanup error:', error);
    }
});

describe('Assignment API', () => {
    describe('POST /api/assignments', () => {
        it('should create a new cohort assignment when admin is authenticated', async () => {
            const assignmentData = {
                reviewer: reviewerId,
                assignmentType: 'cohort',
                assignedTo: cohortId
            };

            const response = await request(app)
                .post('/api/assignments')
                .set('Cookie', adminCookies)
                .send(assignmentData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.reviewer._id).toBe(reviewerId);
            expect(response.body.data.assignmentType).toBe('cohort');
            expect(response.body.data.assignedTo._id).toBe(cohortId);

            // Save assignment ID for later tests
            assignmentId = response.body.data._id;

            // Verify cohort was updated with reviewer
            const cohortResponse = await request(app)
                .get(`/api/cohorts/${cohortId}`)
                .set('Cookie', adminCookies);

            expect(cohortResponse.body.data.assignedReviewers).toContain(reviewerId);
        });

        it('should create a new student assignment when admin is authenticated', async () => {
            const assignmentData = {
                reviewer: reviewerId,
                assignmentType: 'student',
                assignedTo: studentId
            };

            const response = await request(app)
                .post('/api/assignments')
                .set('Cookie', adminCookies)
                .send(assignmentData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.reviewer._id).toBe(reviewerId);
            expect(response.body.data.assignmentType).toBe('student');
            expect(response.body.data.assignedTo._id).toBe(studentId);
        });

        it('should create a new project assignment when admin is authenticated', async () => {
            const assignmentData = {
                reviewer: reviewerId,
                assignmentType: 'project',
                assignedTo: projectId
            };

            const response = await request(app)
                .post('/api/assignments')
                .set('Cookie', adminCookies)
                .send(assignmentData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.reviewer._id).toBe(reviewerId);
            expect(response.body.data.assignmentType).toBe('project');
            expect(response.body.data.assignedTo._id).toBe(projectId);
        });

        it('should not allow students to create assignments', async () => {
            const assignmentData = {
                reviewer: reviewerId,
                assignmentType: 'cohort',
                assignedTo: cohortId
            };

            const response = await request(app)
                .post('/api/assignments')
                .set('Cookie', studentCookies)
                .send(assignmentData);

            expect(response.status).toBe(403);
        });

        it('should validate assignment data', async () => {
            const response = await request(app)
                .post('/api/assignments')
                .set('Cookie', adminCookies)
                .send({
                    reviewer: reviewerId,
                    assignmentType: 'invalid_type', // Invalid assignment type
                    assignedTo: cohortId
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation error');
        });

        it('should not allow assigning to non-existent entities', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .post('/api/assignments')
                .set('Cookie', adminCookies)
                .send({
                    reviewer: reviewerId,
                    assignmentType: 'cohort',
                    assignedTo: fakeId
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Cohort not found');
        });

        it('should not allow duplicate active assignments', async () => {
            const assignmentData = {
                reviewer: reviewerId,
                assignmentType: 'cohort',
                assignedTo: cohortId
            };

            const response = await request(app)
                .post('/api/assignments')
                .set('Cookie', adminCookies)
                .send(assignmentData);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('This assignment already exists and is active');
        });
    });

    describe('GET /api/assignments', () => {
        it('should get all assignments when admin is authenticated', async () => {
            const response = await request(app)
                .get('/api/assignments')
                .set('Cookie', adminCookies);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should not allow students to get all assignments', async () => {
            const response = await request(app)
                .get('/api/assignments')
                .set('Cookie', studentCookies);

            expect(response.status).toBe(403);
        });

        it('should filter assignments by reviewer', async () => {
            const response = await request(app)
                .get(`/api/assignments?reviewer=${reviewerId}`)
                .set('Cookie', adminCookies);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].reviewer._id).toBe(reviewerId);
        });

        it('should filter assignments by assignment type', async () => {
            const response = await request(app)
                .get('/api/assignments?assignmentType=cohort')
                .set('Cookie', adminCookies);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].assignmentType).toBe('cohort');
        });
    });

    describe('GET /api/assignments/reviewers/:id', () => {
        it('should get assignments for a specific reviewer when that reviewer is authenticated', async () => {
            const response = await request(app)
                .get(`/api/assignments/reviewers/${reviewerId}`)
                .set('Cookie', reviewerCookies);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].reviewer._id).toBe(reviewerId);
        });

        it('should allow admins to get assignments for any reviewer', async () => {
            const response = await request(app)
                .get(`/api/assignments/reviewers/${reviewerId}`)
                .set('Cookie', adminCookies);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should not allow students to get reviewer assignments', async () => {
            const response = await request(app)
                .get(`/api/assignments/reviewers/${reviewerId}`)
                .set('Cookie', studentCookies);

            expect(response.status).toBe(403);
        });

        it('should not allow reviewers to get assignments for other reviewers', async () => {
            // Create another reviewer
            const anotherReviewer = {
                email: 'anotherreviewer@example.com',
                password: 'Password123!',
                firstName: 'Another',
                lastName: 'Reviewer',
                role: 'reviewer'
            };

            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(anotherReviewer);

            const anotherReviewerId = registerResponse.body.user._id;

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: anotherReviewer.email,
                    password: anotherReviewer.password
                });

            const anotherReviewerCookies = loginResponse.headers['set-cookie'];

            const response = await request(app)
                .get(`/api/assignments/reviewers/${reviewerId}`)
                .set('Cookie', anotherReviewerCookies);

            expect(response.status).toBe(403);

            // Clean up
            await User.deleteOne({ email: anotherReviewer.email });
        });
    });

    describe('PUT /api/assignments/:id', () => {
        it('should update an assignment when admin is authenticated', async () => {
            const response = await request(app)
                .put(`/api/assignments/${assignmentId}`)
                .set('Cookie', adminCookies)
                .send({
                    isActive: false
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.isActive).toBe(false);

            // Verify cohort was updated (reviewer removed)
            const cohortResponse = await request(app)
                .get(`/api/cohorts/${cohortId}`)
                .set('Cookie', adminCookies);

            expect(cohortResponse.body.data.assignedReviewers).not.toContain(reviewerId);
        });

        it('should not allow students to update assignments', async () => {
            const response = await request(app)
                .put(`/api/assignments/${assignmentId}`)
                .set('Cookie', studentCookies)
                .send({
                    isActive: true
                });

            expect(response.status).toBe(403);
        });

        it('should reactivate an assignment', async () => {
            const response = await request(app)
                .put(`/api/assignments/${assignmentId}`)
                .set('Cookie', adminCookies)
                .send({
                    isActive: true
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.isActive).toBe(true);

            // Verify cohort was updated (reviewer added back)
            const cohortResponse = await request(app)
                .get(`/api/cohorts/${cohortId}`)
                .set('Cookie', adminCookies);

            expect(cohortResponse.body.data.assignedReviewers).toContain(reviewerId);
        });
    });

    describe('DELETE /api/assignments/:id', () => {
        it('should delete an assignment when admin is authenticated', async () => {
            const response = await request(app)
                .delete(`/api/assignments/${assignmentId}`)
                .set('Cookie', adminCookies);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Assignment deleted successfully');

            // Verify assignment was deleted
            const getResponse = await request(app)
                .get('/api/assignments')
                .set('Cookie', adminCookies);

            const deletedAssignment = getResponse.body.data.find(a => a._id === assignmentId);
            expect(deletedAssignment).toBeUndefined();

            // Verify cohort was updated (reviewer removed)
            const cohortResponse = await request(app)
                .get(`/api/cohorts/${cohortId}`)
                .set('Cookie', adminCookies);

            expect(cohortResponse.body.data.assignedReviewers).not.toContain(reviewerId);
        });

        it('should not allow students to delete assignments', async () => {
            // Create a new assignment first
            const assignmentData = {
                reviewer: reviewerId,
                assignmentType: 'cohort',
                assignedTo: cohortId
            };

            const createResponse = await request(app)
                .post('/api/assignments')
                .set('Cookie', adminCookies)
                .send(assignmentData);

            const newAssignmentId = createResponse.body.data._id;

            const response = await request(app)
                .delete(`/api/assignments/${newAssignmentId}`)
                .set('Cookie', studentCookies);

            expect(response.status).toBe(403);

            // Clean up
            await request(app)
                .delete(`/api/assignments/${newAssignmentId}`)
                .set('Cookie', adminCookies);
        });
    });
}); 