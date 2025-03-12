/**
 * Script to verify users by ID
 * This is useful for testing when we need to verify users
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');

// User IDs to verify
const userIds = [
    '67d1eaf2246c7dc36a538101', // test@example.com
    '67d1eaf3246c7dc36a538104'  // admin@example.com
];

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

// Verify users
const verifyUsers = async () => {
    try {
        await connectDB();

        for (const userId of userIds) {
            // Find user
            const user = await User.findById(userId);

            if (!user) {
                console.log(`User with ID ${userId} not found`);
                continue;
            }

            // Verify user
            user.isVerified = true;
            user.verificationToken = undefined;
            user.verificationTokenExpires = undefined;

            await user.save();

            console.log(`User ${user.email} (${user._id}) verified successfully`);
        }

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error(`Error verifying users: ${error.message}`);
    }
};

// Run the script
verifyUsers(); 