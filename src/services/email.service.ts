import nodemailer from 'nodemailer';
import emailConfig from '../config/email';

// Interface for email template data
interface EmailTemplateData {
    [key: string]: any;
}

// Email service class
class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: emailConfig.service,
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.auth.user,
                pass: emailConfig.auth.pass,
            },
        });
    }

    /**
     * Sends an email using nodemailer
     * @param to Recipient email address
     * @param subject Email subject
     * @param html Email content in HTML format
     * @returns Promise<boolean> indicating success or failure
     */
    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        try {
            const mailOptions = {
                from: emailConfig.from,
                to,
                subject,
                html,
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Email send error:', error);
            return false;
        }
    }

    /**
     * Generate HTML content for account verification email
     * @param data Object containing verification token and user details
     * @returns HTML string for email body
     */
    verificationEmailTemplate(data: EmailTemplateData): string {
        const verificationLink = `${emailConfig.frontendUrl}/auth/verify/${data.token}`;

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .container { 
            background-color: #f9f9f9; 
            border-radius: 5px; 
            padding: 20px; 
            border: 1px solid #eee; 
          }
          .button {
            display: inline-block;
            background-color: #4a5568;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 20px; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to CodeReview Platform!</h2>
          <p>Hello ${data.name},</p>
          <p>Thank you for registering with the CodeReview Platform. To complete your registration and verify your email address, please click the button below:</p>
          <a href="${verificationLink}" class="button">Verify Email Address</a>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p>${verificationLink}</p>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you did not request this email, please ignore it.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CodeReview Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Generate HTML content for password reset email
     * @param data Object containing reset token and user details
     * @returns HTML string for email body
     */
    passwordResetEmailTemplate(data: EmailTemplateData): string {
        const resetLink = `${emailConfig.frontendUrl}/auth/reset-password/${data.token}`;

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .container { 
            background-color: #f9f9f9; 
            border-radius: 5px; 
            padding: 20px; 
            border: 1px solid #eee; 
          }
          .button {
            display: inline-block;
            background-color: #4a5568;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 20px; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hello ${data.name},</p>
          <p>We received a request to reset your password for your CodeReview Platform account. To proceed with resetting your password, please click the button below:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p>${resetLink}</p>
          <p>This password reset link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CodeReview Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Generate HTML content for new comment notification email
     * @param data Object containing comment and project details
     * @returns HTML string for email body
     */
    newCommentEmailTemplate(data: EmailTemplateData): string {
        const commentLink = `${emailConfig.frontendUrl}/projects/${data.projectId}/files/${data.fileId}`;

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Comment on Your Project</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .container { 
            background-color: #f9f9f9; 
            border-radius: 5px; 
            padding: 20px; 
            border: 1px solid #eee; 
          }
          .comment {
            background-color: #fff;
            border-left: 4px solid #4a5568;
            padding: 10px 15px;
            margin: 15px 0;
            border-radius: 0 4px 4px 0;
          }
          .button {
            display: inline-block;
            background-color: #4a5568;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 20px; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>New Comment on Your Project</h2>
          <p>Hello ${data.recipientName},</p>
          <p>${data.commenterName} has left a comment on your project "${data.projectTitle}":</p>
          <div class="comment">
            <p>${data.commentText}</p>
            <p><small>File: ${data.fileName}, Line: ${data.lineNumber}</small></p>
          </div>
          <a href="${commentLink}" class="button">View Comment</a>
          <p>Log in to the CodeReview Platform to respond to this comment.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CodeReview Platform. All rights reserved.</p>
            <p>You're receiving this email because you have notifications enabled for comments on your projects.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Generate HTML content for project status update notification email
     * @param data Object containing project details and status update
     * @returns HTML string for email body
     */
    projectStatusEmailTemplate(data: EmailTemplateData): string {
        const projectLink = `${emailConfig.frontendUrl}/projects/${data.projectId}`;
        let statusMessage = '';
        let statusColor = '';

        switch (data.status) {
            case 'accepted':
                statusMessage = 'Your project has been accepted! Congratulations!';
                statusColor = '#10b981'; // green
                break;
            case 'revision_requested':
                statusMessage = 'Your project requires revision. Please review the feedback and make the necessary changes.';
                statusColor = '#ef4444'; // red
                break;
            default:
                statusMessage = `Your project status has been updated to: ${data.status}`;
                statusColor = '#3b82f6'; // blue
        }

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Project Status Update</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .container { 
            background-color: #f9f9f9; 
            border-radius: 5px; 
            padding: 20px; 
            border: 1px solid #eee; 
          }
          .status {
            background-color: #fff;
            border-left: 4px solid ${statusColor};
            padding: 10px 15px;
            margin: 15px 0;
            border-radius: 0 4px 4px 0;
          }
          .button {
            display: inline-block;
            background-color: #4a5568;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .feedback {
            background-color: #fff;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
          }
          .footer { 
            margin-top: 20px; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Project Status Update</h2>
          <p>Hello ${data.recipientName},</p>
          <div class="status">
            <p>${statusMessage}</p>
          </div>
          <p>Project: <strong>${data.projectTitle}</strong></p>
          ${data.feedback ? `
          <h3>Feedback:</h3>
          <div class="feedback">
            ${data.feedback}
          </div>
          ` : ''}
          <a href="${projectLink}" class="button">View Project</a>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CodeReview Platform. All rights reserved.</p>
            <p>You're receiving this email because you have notifications enabled for project status updates.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Generate HTML content for new assignment notification
     * @param data Object containing assignment details
     * @returns HTML string for email body
     */
    newAssignmentEmailTemplate(data: EmailTemplateData): string {
        let assignmentLink = '';
        let assignmentType = '';

        switch (data.assignmentType) {
            case 'project':
                assignmentLink = `${emailConfig.frontendUrl}/projects/${data.assignedToId}`;
                assignmentType = 'project';
                break;
            case 'cohort':
                assignmentLink = `${emailConfig.frontendUrl}/cohorts/${data.assignedToId}`;
                assignmentType = 'cohort';
                break;
            case 'student':
                assignmentLink = `${emailConfig.frontendUrl}/students/${data.assignedToId}`;
                assignmentType = 'student';
                break;
        }

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Assignment</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .container { 
            background-color: #f9f9f9; 
            border-radius: 5px; 
            padding: 20px; 
            border: 1px solid #eee; 
          }
          .button {
            display: inline-block;
            background-color: #4a5568;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 20px; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>New Assignment</h2>
          <p>Hello ${data.reviewerName},</p>
          <p>You have been assigned to review ${data.assignmentType === 'project' ? 'a project' : `a ${assignmentType}`} in the CodeReview Platform.</p>
          <p><strong>Details:</strong></p>
          ${data.assignmentType === 'project' ? `
          <ul>
            <li>Project: ${data.projectTitle}</li>
            <li>Student: ${data.studentName}</li>
            <li>Submitted on: ${new Date(data.submissionDate).toLocaleDateString()}</li>
          </ul>
          ` : data.assignmentType === 'cohort' ? `
          <ul>
            <li>Cohort: ${data.cohortName}</li>
            <li>Students: ${data.studentCount}</li>
            <li>Start Date: ${new Date(data.startDate).toLocaleDateString()}</li>
          </ul>
          ` : `
          <ul>
            <li>Student: ${data.studentName}</li>
          </ul>
          `}
          <a href="${assignmentLink}" class="button">View Assignment</a>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CodeReview Platform. All rights reserved.</p>
            <p>You're receiving this email because you have been assigned as a reviewer.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Send verification email to user
     * @param email User's email address
     * @param token Verification token
     * @param name User's name
     * @returns Promise<boolean> indicating success or failure
     */
    async sendVerificationEmail(email: string, token: string, name: string): Promise<boolean> {
        const html = this.verificationEmailTemplate({
            token,
            name,
        });

        return this.sendEmail(email, 'Verify Your Email - CodeReview Platform', html);
    }

    /**
     * Send password reset email to user
     * @param email User's email address
     * @param token Reset token
     * @param name User's name
     * @returns Promise<boolean> indicating success or failure
     */
    async sendPasswordResetEmail(email: string, token: string, name: string): Promise<boolean> {
        const html = this.passwordResetEmailTemplate({
            token,
            name,
        });

        return this.sendEmail(email, 'Reset Your Password - CodeReview Platform', html);
    }

    /**
     * Send notification about a new comment
     * @param email Recipient's email address
     * @param data Comment notification data
     * @returns Promise<boolean> indicating success or failure
     */
    async sendNewCommentEmail(email: string, data: EmailTemplateData): Promise<boolean> {
        const html = this.newCommentEmailTemplate(data);

        return this.sendEmail(email, 'New Comment on Your Project - CodeReview Platform', html);
    }

    /**
     * Send notification about project status update
     * @param email Recipient's email address
     * @param data Project status data
     * @returns Promise<boolean> indicating success or failure
     */
    async sendProjectStatusEmail(email: string, data: EmailTemplateData): Promise<boolean> {
        const html = this.projectStatusEmailTemplate(data);

        return this.sendEmail(email, 'Project Status Update - CodeReview Platform', html);
    }

    /**
     * Send notification about new assignment
     * @param email Recipient's email address
     * @param data Assignment data
     * @returns Promise<boolean> indicating success or failure
     */
    async sendNewAssignmentEmail(email: string, data: EmailTemplateData): Promise<boolean> {
        const html = this.newAssignmentEmailTemplate(data);

        return this.sendEmail(email, 'New Assignment - CodeReview Platform', html);
    }
}

// Export a singleton instance
export const emailService = new EmailService();
export default emailService; 