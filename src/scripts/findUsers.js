/**
 * Script to find user IDs by email
 * This is useful for testing when we need to verify users
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

// Find users by email
const findUsers = async () => {
    try {
        await connectDB();

        // Find test user
        const testUser = await User.findOne({ email: 'test@example.com' });
        if (testUser) {
            console.log('Test User:');
            console.log(`ID: ${testUser._id}`);
            console.log(`Email: ${testUser.email}`);
            console.log(`Verified: ${testUser.isVerified}`);
            console.log('-------------------');
        } else {
            console.log('Test user not found');
        }

        // Find admin user
        const adminUser = await User.findOne({ email: 'admin@example.com' });
        if (adminUser) {
            console.log('Admin User:');
            console.log(`ID: ${adminUser._id}`);
            console.log(`Email: ${adminUser.email}`);
            console.log(`Verified: ${adminUser.isVerified}`);
            console.log('-------------------');
        } else {
            console.log('Admin user not found');
        }

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error(`Error finding users: ${error.message}`);
    }
};

// Run the script
findUsers(); 