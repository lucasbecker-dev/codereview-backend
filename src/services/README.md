# Email Service

This directory contains the email service implementation for the CodeReview Platform.

## Overview

The email service provides functionality for sending various types of emails:

- Verification emails for new user accounts
- Password reset emails
- Notification emails for different events (project status updates, new comments, etc.)

## Implementation Details

The email service uses Nodemailer with SMTP configuration to send emails. Email templates are stored in the `src/templates/emails` directory as HTML files with placeholders that are replaced with actual values when sending emails.

## Configuration

Email configuration is stored in the `.env` file with the following variables:

```
EMAIL_HOST=your_smtp_host
EMAIL_PORT=your_smtp_port
EMAIL_SECURE=true_or_false
EMAIL_USER=your_smtp_username
EMAIL_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@example.com
EMAIL_FROM_NAME=Your App Name
```

For development and testing, you can use services like Mailtrap.io to capture emails without actually sending them.

## Testing the Email Service

To test the email service, you can run the test script:

```bash
npm run test-email
```

This script will:

1. Send a verification email
2. Send a password reset email
3. Send a project status notification email
4. Send a new comment notification email

All emails will be sent to the test email address specified in the script (`test@example.com` by default). If you're using Mailtrap.io, you can view these emails in your Mailtrap inbox.

### Customizing the Test

If you want to test with a different email address, you can modify the `testEmail` variable in the `src/scripts/testEmail.js` file.

## Email Templates

The email templates are located in the `src/templates/emails` directory:

- `verification.html` - Template for account verification emails
- `password-reset.html` - Template for password reset emails
- `notification.html` - Template for various notification emails

These templates use a simple placeholder system with `{{placeholderName}}` syntax. The placeholders are replaced with actual values when sending emails.

## Using the Email Service in Controllers

Here's an example of how to use the email service in a controller:

```javascript
const emailService = require('../services/email.service');
const tokenGenerator = require('../utils/tokenGenerator');

// In your registration controller
const register = async (req, res) => {
  try {
    // Create user logic...
    
    // Generate verification token
    const { token, expiresAt } = tokenGenerator.generateVerificationToken();
    
    // Save token to user record
    user.verificationToken = token;
    user.verificationTokenExpires = expiresAt;
    await user.save();
    
    // Send verification email
    await emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      token
    );
    
    // Response logic...
  } catch (error) {
    // Error handling...
  }
};
