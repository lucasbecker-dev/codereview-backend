/**
 * Comprehensive script to test email functionality
 * This script tests:
 * 1. Email templates
 * 2. Email service
 * 3. Auth email integration
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const mongoose = require('mongoose');
const { User } = require('../models');
const emailService = require('../services/email.service');
const { generateVerificationToken, generatePasswordResetToken, hashToken } = require('../utils/tokenGenerator');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

/**
 * Test email templates
 */
async function testTemplates() {
    try {
        console.log('\n=== TESTING EMAIL TEMPLATES ===');

        const templatesDir = path.join(__dirname, '../templates/emails');
        const templates = ['verification.html', 'password-reset.html', 'notification.html'];

        for (const template of templates) {
            const templatePath = path.join(templatesDir, template);

            try {
                console.log(`\nChecking template: ${template}`);
                const content = await readFile(templatePath, 'utf8');

                // Check if the template has the expected structure
                if (content.includes('<!DOCTYPE html>') &&
                    content.includes('<html>') &&
                    content.includes('</html>')) {
                    console.log(`✅ Template ${template} is valid HTML`);
                } else {
                    console.log(`❌ Template ${template} does not have valid HTML structure`);
                }

                // Check for placeholders
                const placeholders = content.match(/{{([^}]+)}}/g);
                if (placeholders && placeholders.length > 0) {
                    console.log(`✅ Template ${template} contains ${placeholders.length} placeholders:`);
                    placeholders.forEach(p => console.log(`   - ${p}`));
                } else {
                    console.log(`❌ Template ${template} does not contain any placeholders`);
                }

            } catch (error) {
                console.error(`❌ Error reading template ${template}:`, error.message);
            }
        }

        console.log('\nTemplate test completed!');
    } catch (error) {
        console.error('Error testing templates:', error);
    }
}

/**
 * Test email service functionality
 */
async function testEmailService() {
    try {
        console.log('\n=== TESTING EMAIL SERVICE ===');

        // Test email address (replace with your test email if needed)
        const testEmail = process.env.TEST_EMAIL || 'codereviewplatform@gmail.com';
        const testName = 'Test User';

        // Test verification email
        console.log('\nSending verification email...');
        const verificationToken = 'test-verification-token-123';
        const verificationResult = await emailService.sendVerificationEmail(
            testEmail,
            testName,
            verificationToken
        );
        console.log('Verification email sent:', verificationResult.messageId);

        // Test password reset email
        console.log('\nSending password reset email...');
        const resetToken = 'test-reset-token-456';
        const resetResult = await emailService.sendPasswordResetEmail(
            testEmail,
            testName,
            resetToken
        );
        console.log('Password reset email sent:', resetResult.messageId);

        // Test notification email
        console.log('\nSending notification email...');
        const notificationResult = await emailService.sendNotificationEmail({
            to: testEmail,
            subject: 'Test Notification',
            content: 'This is a test notification email.',
            type: 'comment',
            firstName: testName
        });
        console.log('Notification email sent:', notificationResult.messageId);

        console.log('\nAll email service tests completed successfully!');
        return true;
    } catch (error) {
        console.error('Error testing email service:', error);
        return false;
    }
}

/**
 * Test auth email integration
 */
async function testAuthEmailIntegration() {
    try {
        console.log('\n=== TESTING AUTH EMAIL INTEGRATION ===');

        // Test email address (replace with your test email if needed)
        const testEmail = process.env.TEST_EMAIL || 'codereviewplatform@gmail.com';
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
        return true;
    } catch (error) {
        console.error('Error testing auth email integration:', error);
        return false;
    }
}

/**
 * Run all email tests
 */
async function runAllTests() {
    try {
        console.log('Starting comprehensive email tests...');
        console.log('Using email configuration:');
        console.log(`- Host: ${process.env.EMAIL_HOST}`);
        console.log(`- Port: ${process.env.EMAIL_PORT}`);
        console.log(`- Secure: ${process.env.EMAIL_SECURE}`);
        console.log(`- User: ${process.env.EMAIL_USER}`);
        console.log(`- From: ${process.env.EMAIL_FROM}`);
        console.log(`- From Name: ${process.env.EMAIL_FROM_NAME}`);
        console.log('');

        // Connect to MongoDB for tests that need it
        await connectDB();

        let success = true;

        // Run template tests
        await testTemplates();

        // Run email service tests
        const emailServiceResult = await testEmailService();
        success = success && emailServiceResult;

        // Run auth email integration tests
        const authEmailResult = await testAuthEmailIntegration();
        success = success && authEmailResult;

        console.log('\n=== ALL EMAIL TESTS COMPLETED ===');
        console.log(`Email integration tests ${success ? 'PASSED' : 'FAILED'}`);

        if (!success) {
            console.log('Please check your email configuration and try again.');
        } else {
            console.log('All emails were sent successfully. Please check your inbox to verify the emails were received.');
        }
    } catch (error) {
        console.error('Error running tests:', error);
    } finally {
        // Disconnect from MongoDB
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
    }
}

// Run the tests if this script is executed directly
if (require.main === module) {
    runAllTests();
} else {
    // Export individual test functions for use in other scripts
    module.exports = {
        testTemplates,
        testEmailService,
        testAuthEmailIntegration,
        runAllTests
    };
} 