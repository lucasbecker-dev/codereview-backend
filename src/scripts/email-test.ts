/**
 * Email Service Test Script
 * 
 * This script tests the email service by sending test emails.
 * 
 * To run this script:
 * 1. Make sure you have set up the email configuration in .env file
 * 2. Run: npm run email-test
 * 
 * The script will send test emails to the address specified in TEST_EMAIL
 * environment variable or fall back to the email account configured for sending.
 */

import { emailService } from '../services/email.service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmailService() {
    // Test verification email
    console.log('Testing verification email...');
    const verificationResult = await emailService.sendVerificationEmail(
        process.env.TEST_EMAIL || process.env.EMAIL_USER || '',
        'test-verification-token-123',
        'Test User'
    );
    console.log('Verification email result:', verificationResult);

    // Test password reset email
    console.log('Testing password reset email...');
    const resetResult = await emailService.sendPasswordResetEmail(
        process.env.TEST_EMAIL || process.env.EMAIL_USER || '',
        'test-reset-token-123',
        'Test User'
    );
    console.log('Password reset email result:', resetResult);
}

// Run the test
testEmailService()
    .then(() => {
        console.log('Email tests completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error during email tests:', error);
        process.exit(1);
    }); 