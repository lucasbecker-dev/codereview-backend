const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Cohort = require('../models/Cohort');

// Test user credentials
const testAdmin = {
    email: 'testadmin@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin'
};

const testSuperAdmin = {
    email: 'testsuperadmin@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'SuperAdmin',
    role: 'superadmin'
};

const testStudent = {
    email: 'teststudent@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Student',
    role: 'student'
};

// Test cohort data
const testCohort = {
    name: 'Test Cohort',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-06-30')
};

// Global variables to store cookies and IDs
let adminCookies;
let superAdminCookies;
let studentCookies;
let studentId;
let cohortId;

// Setup before tests
beforeAll(async () => {
    try {
        // Clear test data
        await User.deleteMany({
            email: {
                $in: [testAdmin.email, testSuperAdmin.email, testStudent.email]
            }
        });
        await Cohort.deleteMany({ name: testCohort.name });

        // Register test users
        const adminResponse = await request(app)
            .post('/api/auth/register')
            .send(testAdmin);

        const superAdminResponse = await request(app)
            .post('/api/auth/register')
            .send(testSuperAdmin);

        const studentResponse = await request(app)
            .post('/api/auth/register')
            .send(testStudent);

        studentId = studentResponse.body.user._id;

        // Login test users to get cookies
        const adminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testAdmin.email,
                password: testAdmin.password
            });

        const superAdminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testSuperAdmin.email,
                password: testSuperAdmin.password
            });

        const studentLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testStudent.email,
                password: testStudent.password
            });

        adminCookies = adminLoginResponse.headers['set-cookie'];
        superAdminCookies = superAdminLoginResponse.headers['set-cookie'];
        studentCookies = studentLoginResponse.headers['set-cookie'];
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
                $in: [testAdmin.email, testSuperAdmin.email, testStudent.email]
            }
        });
        await Cohort.deleteMany({ name: testCohort.name });

        // Close MongoDB connection
        await mongoose.connection.close();
    } catch (error) {
        console.error('Cleanup error:', error);
    }
});

describe('Cohort API', () => {
    describe('POST /api/cohorts', () => {
        it('should create a new cohort when admin is authenticated', async () => {
            const response = await request(app)
                .post('/api/cohorts')
                .set('Cookie', adminCookies)
                .send(testCohort);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(testCohort.name);

            // Save cohort ID for later tests
            cohortId = response.body.data._id;
        });

        it('should not allow students to create cohorts', async () => {
            const response = await request(app)
                .post('/api/cohorts')
                .set('Cookie', studentCookies)
                .send({
                    name: 'Student Cohort',
                    startDate: new Date('2023-01-01'),
                    endDate: new Date('2023-06-30')
                });

            expect(response.status).toBe(403);
        });

        it('should validate cohort data', async () => {
            const response = await request(app)
                .post('/api/cohorts')
                .set('Cookie', adminCookies)
                .send({
                    name: 'Invalid Cohort',
                    startDate: new Date('2023-06-30'),
                    endDate: new Date('2023-01-01') // End date before start date
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation error');
        });

        it('should not allow duplicate cohort names', async () => {
            const response = await request(app)
                .post('/api/cohorts')
                .set('Cookie', adminCookies)
                .send(testCohort); // Same name as already created cohort

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('A cohort with this name already exists');
        });
    });

    describe('GET /api/cohorts', () => {
        it('should get all cohorts when admin is authenticated', async () => {
            const response = await request(app)
                .get('/api/cohorts')
                .set('Cookie', adminCookies);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should not allow students to get all cohorts', async () => {
            const response = await request(app)
                .get('/api/cohorts')
                .set('Cookie', studentCookies);

            expect(response.status).toBe(403);
        });

        it('should filter cohorts by name', async () => {
            const response = await request(app)
                .get(`/api/cohorts?name=${testCohort.name}`)
                .set('Cookie', adminCookies);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].name).toBe(testCohort.name);
        });
    });

    describe('GET /api/cohorts/:id', () => {
        it('should get a single cohort by ID when admin is authenticated', async () => {
            const response = await request(app)
                .get(`/api/cohorts/${cohortId}`)
                .set('Cookie', adminCookies);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(cohortId);
            expect(response.body.data.name).toBe(testCohort.name);
        });

        it('should not allow students to get a single cohort', async () => {
            const response = await request(app)
                .get(`/api/cohorts/${cohortId}`)
                .set('Cookie', studentCookies);

            expect(response.status).toBe(403);
        });

        it('should return 404 for non-existent cohort', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/cohorts/${fakeId}`)
                .set('Cookie', adminCookies);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Cohort not found');
        });
    });

    describe('PUT /api/cohorts/:id', () => {
        it('should update a cohort when admin is authenticated', async () => {
            const updatedData = {
                name: 'Updated Test Cohort',
                startDate: new Date('2023-02-01'),
                endDate: new Date('2023-07-31'),
                students: [studentId]
            };

            const response = await request(app)
                .put(`/api/cohorts/${cohortId}`)
                .set('Cookie', adminCookies)
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(updatedData.name);
            expect(response.body.data.students.length).toBe(1);

            // Verify student was updated with cohort reference
            const studentResponse = await request(app)
                .get(`/api/users/${studentId}`)
                .set('Cookie', adminCookies);

            expect(studentResponse.body.data.cohort).toBe(cohortId);
        });

        it('should not allow students to update cohorts', async () => {
            const response = await request(app)
                .put(`/api/cohorts/${cohortId}`)
                .set('Cookie', studentCookies)
                .send({
                    name: 'Student Updated Cohort'
                });

            expect(response.status).toBe(403);
        });

        it('should validate update data', async () => {
            const response = await request(app)
                .put(`/api/cohorts/${cohortId}`)
                .set('Cookie', adminCookies)
                .send({
                    startDate: new Date('2023-08-01'),
                    endDate: new Date('2023-07-01') // End date before start date
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation error');
        });
    });

    describe('DELETE /api/cohorts/:id', () => {
        it('should not allow admins to delete cohorts (superadmin only)', async () => {
            const response = await request(app)
                .delete(`/api/cohorts/${cohortId}`)
                .set('Cookie', adminCookies);

            expect(response.status).toBe(403);
        });

        it('should allow superadmins to delete cohorts', async () => {
            const response = await request(app)
                .delete(`/api/cohorts/${cohortId}`)
                .set('Cookie', superAdminCookies);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Cohort deleted successfully');

            // Verify cohort was deleted
            const getResponse = await request(app)
                .get(`/api/cohorts/${cohortId}`)
                .set('Cookie', adminCookies);

            expect(getResponse.status).toBe(404);

            // Verify student's cohort reference was removed
            const studentResponse = await request(app)
                .get(`/api/users/${studentId}`)
                .set('Cookie', adminCookies);

            expect(studentResponse.body.data.cohort).toBeUndefined();
        });
    });
}); 