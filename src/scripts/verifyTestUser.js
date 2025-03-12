/**
 * Script to verify a test user
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Import User model
const User = require('../models/User');

// Email of the user to verify
const userEmail = 'testuser@example.com';

// Verify the user
const verifyUser = async () => {
    try {
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.log(`User with email ${userEmail} not found`);
            return;
        }

        user.isVerified = true;
        await user.save();

        console.log(`User ${userEmail} verified successfully`);
    } catch (error) {
        console.error('Error verifying user:', error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    }
};

// Run the verification
verifyUser(); 