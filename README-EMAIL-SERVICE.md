# Email Service Implementation

This document provides instructions on how to test and use the email service implementation for the CodeReview Platform.

## Overview

The email service provides functionality for sending various types of emails:

- Verification emails for new user accounts
- Password reset emails
- Notification emails for different events (project status updates, new comments, etc.)

## Implementation Details

The email service is implemented using:

- **Nodemailer**: For sending emails via SMTP
- **HTML Templates**: For email content with placeholders
- **Token Generator**: For generating secure verification and reset tokens

## Directory Structure

```
codereview-backend/
├── src/
│   ├── services/
│   │   ├── email.service.js       # Main email service implementation
│   │   └── README.md              # Service documentation
│   ├── templates/
│   │   └── emails/
│   │       ├── verification.html  # Account verification template
│   │       ├── password-reset.html # Password reset template
│   │       └── notification.html  # General notification template
│   ├── utils/
│   │   └── tokenGenerator.js      # Token generation utilities
│   ├── scripts/
│   │   ├── testEmail.js           # Script to test email sending
│   │   └── testTemplates.js       # Script to test template loading
│   └── tests/
│       └── email.service.test.js  # Unit tests for email service
```

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
FRONTEND_URL=http://localhost:3000
```

## Testing the Email Service

There are several ways to test the email service:

### 1. Using the Test Script

Run the test script to send test emails:

```bash
npm run test-email
```

This script will:

1. Send a verification email
2. Send a password reset email
3. Send a project status notification email
4. Send a new comment notification email

All emails will be sent to the test email address specified in the script (`test@example.com` by default).

### 2. Testing Templates

To verify that email templates are properly loaded and parsed:

```bash
npm run test-templates
```

This script will:

1. Check if all templates exist
2. Verify that templates have valid HTML structure
3. Identify and list all placeholders in each template

### 3. Running Unit Tests

To run the unit tests for the email service:

```bash
npm test
```

The tests use Jest's mocking capabilities to test the email service without actually sending emails.

## Using Mailtrap for Testing

For development and testing, we recommend using [Mailtrap.io](https://mailtrap.io/), which provides a fake SMTP server that captures emails without actually sending them to real recipients.

1. Sign up for a free Mailtrap account
2. Create an inbox
3. Get the SMTP credentials from the inbox settings
4. Update your `.env` file with the Mailtrap credentials:

```
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your_mailtrap_username
EMAIL_PASSWORD=your_mailtrap_password
```

With this setup, all emails sent by the application will be captured in your Mailtrap inbox, where you can view them, check HTML rendering, and analyze headers.

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
```

## Email Templates

The email templates use a simple placeholder system with `{{placeholderName}}` syntax. The placeholders are replaced with actual values when sending emails.

### Verification Email

Placeholders:

- `{{name}}`: Recipient's name
- `{{verificationUrl}}`: URL for email verification

### Password Reset Email

Placeholders:

- `{{name}}`: Recipient's name
- `{{resetUrl}}`: URL for password reset

### Notification Email

Placeholders:

- `{{name}}`: Recipient's name
- `{{subject}}`: Email subject
- `{{projectTitle}}`: Title of the project (if applicable)
- `{{projectStatus}}`: Status of the project (if applicable)
- `{{statusClass}}`: CSS class for styling based on status
- `{{commentAuthor}}`: Author of a comment (if applicable)
- `{{commentText}}`: Text of a comment (if applicable)
- `{{assignmentType}}`: Type of assignment (if applicable)
- `{{assignmentName}}`: Name of assignment (if applicable)
- `{{submissionInfo}}`: Information about a submission (if applicable)
- `{{actionUrl}}`: URL for the main call-to-action button

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check your SMTP credentials and make sure the email service is properly configured.
2. **Template not found**: Ensure that the templates directory exists and contains the required template files.
3. **Placeholder not replaced**: Verify that you're passing all required placeholders to the template.

### Debugging

To enable detailed logging for Nodemailer, add the following to your `.env` file:

```
NODE_DEBUG=nodemailer
```

This will output detailed information about the SMTP connection and email sending process.

## Next Steps

- Implement email queue for handling high volume of emails
- Add support for email attachments
- Create more specialized email templates for different notification types
- Add support for internationalization (i18n) in email templates
