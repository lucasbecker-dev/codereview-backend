require('dotenv').config();
const emailService = require('../services/email.service');

/**
 * Test script to verify email service functionality
 */
async function testEmailService() {
    try {
        console.log('Testing Email Service...');

        // Test email address (replace with your test email if needed)
        const testEmail = 'test@example.com';
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

        // Test notification email - project status
        console.log('\nSending project status notification email...');
        const projectStatusResult = await emailService.sendNotificationEmail(
            testEmail,
            testName,
            'projectStatus',
            {
                projectTitle: 'Test Project',
                projectStatus: 'accepted',
                statusClass: 'status-accepted',
                actionUrl: `${process.env.FRONTEND_URL}/projects/123`,
                subject: 'Project Status Update'
            }
        );
        console.log('Project status notification email sent:', projectStatusResult.messageId);

        // Test notification email - new comment
        console.log('\nSending new comment notification email...');
        const commentResult = await emailService.sendNotificationEmail(
            testEmail,
            testName,
            'newComment',
            {
                projectTitle: 'Test Project',
                commentAuthor: 'Reviewer Name',
                commentText: 'This is a test comment on your project.',
                actionUrl: `${process.env.FRONTEND_URL}/projects/123/comments`,
                subject: 'New Comment on Your Project'
            }
        );
        console.log('New comment notification email sent:', commentResult.messageId);

        console.log('\nAll email tests completed successfully!');
    } catch (error) {
        console.error('Error testing email service:', error);
    }
}

// Run the test
testEmailService(); 