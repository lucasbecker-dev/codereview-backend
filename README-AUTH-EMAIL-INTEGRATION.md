# Authentication and Email Service Integration

This document provides instructions on how to test and use the integration of the authentication system with the email service for the CodeReview Platform.

## Overview

The authentication system has been integrated with the email service to provide the following functionality:

- Sending verification emails when users register
- Sending password reset emails when users request a password reset
- Using HTML email templates with proper styling and branding

## Implementation Details

The integration involves the following components:

- **Authentication Controller**: Handles user registration, login, verification, and password reset
- **Email Service**: Provides methods for sending different types of emails
- **Token Generator**: Generates secure tokens for verification and password reset
- **User Model**: Stores user data including verification and reset tokens

## Directory Structure

```
codereview-backend/
├── src/
│   ├── controllers/
│   │   └── auth.controller.js       # Authentication controller with email integration
│   ├── services/
│   │   └── email.service.js         # Email service implementation
│   ├── templates/
│   │   └── emails/
│   │       ├── verification.html    # Email verification template
│   │       ├── password-reset.html  # Password reset template
│   │       └── notification.html    # Notification template
│   ├── utils/
│   │   └── tokenGenerator.js        # Token generation utilities
│   ├── models/
│   │   └── User.js                  # User model with token fields
│   └── scripts/
│       ├── testEmail.js             # Script to test email sending
│       ├── testTemplates.js         # Script to test template loading
│       └── testAuthEmail.js         # Script to test auth-email integration
```

## Key Changes Made

1. Updated the User model to include:
   - `verificationTokenExpires` field for email verification token expiry
   - Renamed `resetPasswordExpire` to `resetPasswordExpires` for consistency

2. Updated the authentication controller to:
   - Use the email service for sending verification and reset emails
   - Use the token generator for creating secure tokens with expiry
   - Handle token expiration properly

3. Updated email templates to:
   - Use consistent styling and branding
   - Include proper placeholders for dynamic content
   - Update copyright year to 2025

## Testing the Integration

There are several ways to test the integration:

### 1. Using the Auth Email Integration Test Script

Run the test script to verify the integration:

```bash
npm run test-auth-email
```

This script will:

1. Create a test user with a verification token
2. Send a verification email
3. Update the user with a password reset token
4. Send a password reset email
5. Simulate the verification process
6. Simulate the password reset process

### 2. Testing the Full Registration Flow

To test the full registration flow:

1. Start the server:

   ```bash
   npm run dev
   ```

2. Use an API client like Postman or curl to register a new user:

   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
   ```

3. Check your email (or Mailtrap inbox) for the verification email

4. Use the verification link or make a request to verify the email:

   ```bash
   curl -X POST http://localhost:5000/api/auth/verify/:token
   ```

5. Test the password reset flow:

   ```bash
   curl -X POST http://localhost:5000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

6. Check your email for the password reset link

7. Use the reset link or make a request to reset the password:

   ```bash
   curl -X POST http://localhost:5000/api/auth/reset-password/:token \
     -H "Content-Type: application/json" \
     -d '{"password":"newpassword123"}'
   ```

### 3. Using Mailtrap for Testing

For development and testing, we recommend using [Mailtrap.io](https://mailtrap.io/), which provides a fake SMTP server that captures emails without actually sending them to real recipients.

1. Sign up for a free Mailtrap account
2. Create an inbox
3. Get the SMTP credentials from the inbox settings
4. Update your `.env` file with the Mailtrap credentials (already configured)

With this setup, all emails sent by the application will be captured in your Mailtrap inbox, where you can view them, check HTML rendering, and analyze headers.

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check your SMTP credentials and make sure the email service is properly configured.
2. **Template not found**: Ensure that the templates directory exists and contains the required template files.
3. **Token expiration issues**: Verify that the token expiration dates are being set correctly.
4. **Database connection issues**: Make sure MongoDB is running and accessible.

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
- Implement rate limiting for email sending to prevent abuse
