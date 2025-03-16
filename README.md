# CodeReview Platform - Backend

A robust API backend for the CodeReview platform, enabling bootcamp students to submit coding projects and receive feedback from assigned reviewers.

## Technology Stack

- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- AWS S3 for file storage
- SendGrid/Nodemailer for email services

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- MongoDB (local or Atlas)
- AWS account (for S3 file storage)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/codereview-backend.git
   cd codereview-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/codereview
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRATION=7d
   S3_ACCESS_KEY=your_aws_access_key
   S3_SECRET_KEY=your_aws_secret_key
   S3_BUCKET_NAME=your_s3_bucket_name
   S3_REGION=your_s3_region
   FRONTEND_URL=http://localhost:3000
   EMAIL_SERVICE=smtp
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=your_email_user
   EMAIL_PASS=your_email_password
   EMAIL_FROM=noreply@codereview.com
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. The API will be available at `http://localhost:5000/api`

## Deployment

This project is configured for deployment on Railway. When you push changes to the main branch, Railway will automatically build and deploy the application.

### Railway Configuration

- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables: Configure all the variables from the `.env` file in Railway's dashboard

## Project Structure

The project follows a feature-based structure:

- `/src/controllers`: Request handlers
- `/src/models`: Mongoose models
- `/src/routes`: API routes
- `/src/middleware`: Express middleware
- `/src/services`: External service integrations
- `/src/config`: Configuration files
- `/src/utils`: Utility functions

## API Documentation

The API follows RESTful principles with the following main endpoints:

- `/api/auth`: Authentication endpoints
- `/api/users`: User management
- `/api/projects`: Project submission and management
- `/api/files`: File upload and retrieval
- `/api/comments`: Code review comments
- `/api/cohorts`: Cohort management
- `/api/assignments`: Reviewer assignments
- `/api/notifications`: User notifications

Detailed API documentation is available in the `/docs` directory.

## Development Guidelines

- Follow RESTful API design principles
- Implement proper error handling and validation
- Use middleware for authentication and validation
- Organize code by feature
- Write clear and concise comments
