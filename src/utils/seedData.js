const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Import models (these will be created in Phase 1)
// For now, we'll define the structure but comment out the actual imports
// const User = require('../models/User');
// const Project = require('../models/Project');
// const Comment = require('../models/Comment');

/**
 * Generate sample users for development
 * @returns {Array} Array of user objects
 */
const generateUsers = async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    return [
        {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            isEmailVerified: true,
        },
        {
            firstName: 'Reviewer',
            lastName: 'User',
            email: 'reviewer@example.com',
            password: hashedPassword,
            role: 'reviewer',
            isEmailVerified: true,
        },
        {
            firstName: 'Student',
            lastName: 'One',
            email: 'student1@example.com',
            password: hashedPassword,
            role: 'student',
            isEmailVerified: true,
        },
        {
            firstName: 'Student',
            lastName: 'Two',
            email: 'student2@example.com',
            password: hashedPassword,
            role: 'student',
            isEmailVerified: true,
        }
    ];
};

/**
 * Generate sample projects for development
 * @param {Array} users Array of user objects
 * @returns {Array} Array of project objects
 */
const generateProjects = (users) => {
    const studentIds = users.filter(user => user.role === 'student').map(user => user._id);
    const reviewerId = users.find(user => user.role === 'reviewer')._id;

    return [
        {
            title: 'React Todo App',
            description: 'A simple todo application built with React',
            repositoryUrl: 'https://github.com/example/react-todo',
            liveUrl: 'https://react-todo-example.netlify.app',
            status: 'pending_review',
            student: studentIds[0],
            reviewer: reviewerId,
            technologies: ['React', 'JavaScript', 'CSS'],
            submissionDate: new Date(),
        },
        {
            title: 'Node.js API',
            description: 'RESTful API built with Node.js and Express',
            repositoryUrl: 'https://github.com/example/node-api',
            status: 'in_review',
            student: studentIds[1],
            reviewer: reviewerId,
            technologies: ['Node.js', 'Express', 'MongoDB'],
            submissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        }
    ];
};

/**
 * Generate sample comments for development
 * @param {Array} users Array of user objects
 * @param {Array} projects Array of project objects
 * @returns {Array} Array of comment objects
 */
const generateComments = (users, projects) => {
    const reviewerId = users.find(user => user.role === 'reviewer')._id;

    return [
        {
            content: 'Great work on the UI! Consider adding more tests.',
            author: reviewerId,
            project: projects[0]._id,
            createdAt: new Date(),
        },
        {
            content: 'The API endpoints are well structured, but error handling could be improved.',
            author: reviewerId,
            project: projects[1]._id,
            createdAt: new Date(),
        }
    ];
};

/**
 * Seed the database with sample data
 * This function will be implemented when models are created in Phase 1
 */
const seedDatabase = async () => {
    try {
        console.log('Seeding database with sample data...');

        // Connect to MongoDB if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // Clear existing data
        // await User.deleteMany({});
        // await Project.deleteMany({});
        // await Comment.deleteMany({});

        // Create users
        // const users = await User.create(await generateUsers());

        // Create projects
        // const projects = await Project.create(generateProjects(users));

        // Create comments
        // await Comment.create(generateComments(users, projects));

        console.log('Database seeded successfully!');

        // Return the created data for reference
        return {
            // users,
            // projects,
            // comments
        };
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
};

module.exports = {
    seedDatabase,
    generateUsers,
    generateProjects,
    generateComments
}; 