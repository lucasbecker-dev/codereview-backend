require('dotenv').config();
const emailService = require('../services/email.service');
const path = require('path');
const fs = require('fs');

// Mock nodemailer
jest.mock('nodemailer');
const nodemailer = require('nodemailer');

describe('Email Service', () => {
    let mockTransporter;

    beforeEach(() => {
        // Create a mock transporter
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({
                messageId: 'mock-message-id',
                envelope: { from: 'test@example.com', to: ['recipient@example.com'] }
            })
        };

        // Mock the createTransport method to return our mock transporter
        nodemailer.createTransport.mockReturnValue(mockTransporter);

        // Reset the email service to use the mock transporter
        emailService.transporter = mockTransporter;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('loadTemplate', () => {
        it('should load a template and replace placeholders', async () => {
            // Create a temporary test template
            const templatesDir = path.join(__dirname, '../templates/emails');
            if (!fs.existsSync(templatesDir)) {
                fs.mkdirSync(templatesDir, { recursive: true });
            }

            const testTemplatePath = path.join(templatesDir, 'test-template.html');
            fs.writeFileSync(testTemplatePath, '<p>Hello {{name}}, welcome to {{app}}!</p>');

            try {
                const result = await emailService.loadTemplate('test-template', {
                    name: 'John',
                    app: 'CodeReview'
                });

                expect(result).toBe('<p>Hello John, welcome to CodeReview!</p>');
            } finally {
                // Clean up the test template
                fs.unlinkSync(testTemplatePath);
            }
        });

        it('should throw an error if template does not exist', async () => {
            await expect(emailService.loadTemplate('non-existent-template', {}))
                .rejects.toThrow();
        });
    });

    describe('sendEmail', () => {
        it('should send an email with the correct options', async () => {
            const emailOptions = {
                to: 'recipient@example.com',
                subject: 'Test Subject',
                html: '<p>Test HTML</p>',
                text: 'Test text'
            };

            await emailService.sendEmail(emailOptions);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
                to: 'recipient@example.com',
                subject: 'Test Subject',
                html: '<p>Test HTML</p>',
                text: 'Test text'
            });
        });
    });

    describe('sendVerificationEmail', () => {
        it('should load the verification template and send an email', async () => {
            // Mock the loadTemplate method
            const originalLoadTemplate = emailService.loadTemplate;
            emailService.loadTemplate = jest.fn().mockResolvedValue('<p>Verification HTML</p>');

            try {
                await emailService.sendVerificationEmail(
                    'recipient@example.com',
                    'John Doe',
                    'verification-token-123'
                );

                expect(emailService.loadTemplate).toHaveBeenCalledWith('verification', {
                    name: 'John Doe',
                    verificationUrl: `${process.env.FRONTEND_URL}/verify?token=${encodeURIComponent('verification-token-123')}`
                });

                expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
                    to: 'recipient@example.com',
                    subject: 'Verify Your Email Address',
                    html: '<p>Verification HTML</p>'
                });
            } finally {
                // Restore the original method
                emailService.loadTemplate = originalLoadTemplate;
            }
        });
    });

    // Add more tests for other email types...
}); 