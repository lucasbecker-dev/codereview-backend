/**
 * Script to verify users by ID or email
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

/**
 * Verify users by ID or email
 * @param {Array} userIds - Optional array of user IDs to verify
 * @param {Array} emails - Optional array of emails to verify
 */
const verifyUsers = async (userIds = [], emails = []) => {
    try {
        await connectDB();
        let verifiedCount = 0;

        // Verify by IDs if provided
        if (userIds.length > 0) {
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
                verifiedCount++;
                console.log(`User ${user.email} (${user._id}) verified successfully`);
            }
        }

        // Verify by emails if provided
        if (emails.length > 0) {
            for (const email of emails) {
                // Find user
                const user = await User.findOne({ email });

                if (!user) {
                    console.log(`User with email ${email} not found`);
                    continue;
                }

                // Verify user
                user.isVerified = true;
                user.verificationToken = undefined;
                user.verificationTokenExpires = undefined;

                await user.save();
                verifiedCount++;
                console.log(`User ${user.email} (${user._id}) verified successfully`);
            }
        }

        // If no specific users provided, verify default test users
        if (userIds.length === 0 && emails.length === 0) {
            const defaultEmails = ['test@example.com', 'testuser@example.com', 'admin@example.com'];
            for (const email of defaultEmails) {
                const user = await User.findOne({ email });
                if (user) {
                    user.isVerified = true;
                    user.verificationToken = undefined;
                    user.verificationTokenExpires = undefined;
                    await user.save();
                    verifiedCount++;
                    console.log(`Default user ${user.email} (${user._id}) verified successfully`);
                }
            }
        }

        console.log(`Total users verified: ${verifiedCount}`);

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error(`Error verifying users: ${error.message}`);
    }
};

// Parse command line arguments
const parseArgs = () => {
    const args = process.argv.slice(2);
    const userIds = [];
    const emails = [];

    args.forEach(arg => {
        if (arg.includes('@')) {
            emails.push(arg);
        } else if (mongoose.Types.ObjectId.isValid(arg)) {
            userIds.push(arg);
        } else {
            console.log(`Invalid argument: ${arg} - must be a valid email or MongoDB ObjectId`);
        }
    });

    return { userIds, emails };
};

// Run the script
if (require.main === module) {
    const { userIds, emails } = parseArgs();
    verifyUsers(userIds, emails);
} else {
    module.exports = verifyUsers;
} 