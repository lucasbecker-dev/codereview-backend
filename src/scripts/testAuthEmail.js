require('dotenv').config();
const { User } = require('../models');
const { generateVerificationToken, generatePasswordResetToken, hashToken } = require('../utils/tokenGenerator');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');

/**
 * Test script to verify the integration of the email service with the authentication system
 */
async function testAuthEmailIntegration() {
    try {
        console.log('Testing Auth Email Integration...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Test email address (replace with your test email if needed)
        const testEmail = 'test@example.com';
        const testName = 'Test User';

        // 1. Test user registration and verification email
        console.log('\n1. Testing user registration and verification email:');

        // Check if test user already exists
        let user = await User.findOne({ email: testEmail });

        if (user) {
            console.log('Test user already exists, deleting...');
            await User.deleteOne({ email: testEmail });
        }

        // Generate verification token
        const { token: verificationToken, expiresAt: verificationExpires } = generateVerificationToken();
        const hashedVerificationToken = hashToken(verificationToken);

        // Create test user
        user = await User.create({
            email: testEmail,
            password: 'password123',
            firstName: testName,
            lastName: 'User',
            role: 'student',
            verificationToken: hashedVerificationToken,
            verificationTokenExpires: verificationExpires,
            isActive: true
        });

        console.log('Test user created:', user._id);

        // Send verification email
        console.log('Sending verification email...');
        const verificationResult = await emailService.sendVerificationEmail(
            testEmail,
            testName,
            verificationToken
        );
        console.log('Verification email sent:', verificationResult.messageId);

        // 2. Test password reset email
        console.log('\n2. Testing password reset email:');

        // Generate password reset token
        const { token: resetToken, expiresAt: resetExpires } = generatePasswordResetToken();
        const hashedResetToken = hashToken(resetToken);

        // Update user with reset token
        user.resetPasswordToken = hashedResetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        console.log('User updated with reset token');

        // Send password reset email
        console.log('Sending password reset email...');
        const resetResult = await emailService.sendPasswordResetEmail(
            testEmail,
            testName,
            resetToken
        );
        console.log('Password reset email sent:', resetResult.messageId);

        // 3. Test verification process
        console.log('\n3. Testing verification process:');

        // Verify user
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        console.log('User verified successfully');

        // 4. Test password reset process
        console.log('\n4. Testing password reset process:');

        // Reset password
        user.password = 'newpassword123';
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        console.log('Password reset successfully');

        console.log('\nAll auth email integration tests completed successfully!');
    } catch (error) {
        console.error('Error testing auth email integration:', error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the test
testAuthEmailIntegration(); 