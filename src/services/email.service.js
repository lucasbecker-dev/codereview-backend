const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

/**
 * Email service for sending various types of emails
 */
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    /**
     * Load an email template and replace placeholders with actual values
     * @param {string} templateName - Name of the template file without extension
     * @param {Object} replacements - Object containing placeholder replacements
     * @returns {Promise<string>} - HTML content of the email
     */
    async loadTemplate(templateName, replacements) {
        try {
            const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
            let template = await readFile(templatePath, 'utf8');

            // Replace all placeholders with actual values
            Object.keys(replacements).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                template = template.replace(regex, replacements[key]);
            });

            return template;
        } catch (error) {
            console.error(`Error loading email template ${templateName}:`, error);
            throw error;
        }
    }

    /**
     * Send an email
     * @param {Object} options - Email options
     * @param {string} options.to - Recipient email
     * @param {string} options.subject - Email subject
     * @param {string} options.html - HTML content of the email
     * @param {string} [options.text] - Plain text content of the email
     * @returns {Promise<Object>} - Nodemailer send result
     */
    async sendEmail({ to, subject, html, text }) {
        try {
            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
                to,
                subject,
                html
            };

            if (text) {
                mailOptions.text = text;
            }

            return await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    /**
     * Send a verification email
     * @param {string} to - Recipient email
     * @param {string} name - Recipient name
     * @param {string} token - Verification token
     * @returns {Promise<Object>} - Nodemailer send result
     */
    async sendVerificationEmail(to, name, token) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify/${token}`;

        const html = await this.loadTemplate('verification', {
            name,
            verificationUrl
        });

        return this.sendEmail({
            to,
            subject: 'Verify Your Email Address',
            html
        });
    }

    /**
     * Send a password reset email
     * @param {string} to - Recipient email
     * @param {string} name - Recipient name
     * @param {string} token - Password reset token
     * @returns {Promise<Object>} - Nodemailer send result
     */
    async sendPasswordResetEmail(to, name, token) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        const html = await this.loadTemplate('password-reset', {
            name,
            resetUrl
        });

        return this.sendEmail({
            to,
            subject: 'Reset Your Password',
            html
        });
    }

    /**
     * Send a notification email
     * @param {string} to - Recipient email
     * @param {string} name - Recipient name
     * @param {string} notificationType - Type of notification
     * @param {Object} data - Notification data
     * @returns {Promise<Object>} - Nodemailer send result
     */
    async sendNotificationEmail(to, name, notificationType, data) {
        let subject = '';
        let templateData = { name, ...data };

        switch (notificationType) {
            case 'projectStatus':
                subject = `Project Status Update: ${data.projectTitle}`;
                break;
            case 'newComment':
                subject = `New Comment on ${data.projectTitle}`;
                break;
            case 'newAssignment':
                subject = 'New Review Assignment';
                break;
            case 'newSubmission':
                subject = 'New Project Submission';
                break;
            default:
                subject = 'Notification from CodeReview Platform';
        }

        const html = await this.loadTemplate('notification', templateData);

        return this.sendEmail({
            to,
            subject,
            html
        });
    }
}

module.exports = new EmailService(); 