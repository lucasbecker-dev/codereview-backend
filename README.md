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

### AWS Elastic Beanstalk Deployment

This project is configured for deployment on AWS Elastic Beanstalk using GitHub Actions. When you push changes to the main branch, GitHub Actions will automatically build and deploy the application.

#### Prerequisites

1. AWS Account with Elastic Beanstalk access
2. Elastic Beanstalk application and environment created (codereview-backend and codereview-backend-env)
3. AWS IAM user with deployment permissions
4. GitHub repository secrets configured

#### GitHub Secrets Setup

Add the following secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID`: Your AWS IAM user access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS IAM user secret key

#### Manual Deployment

If you need to deploy manually:

1. Build the application:

   ```bash
   npm run build
   ```

2. Package the application:

   ```bash
   npm run package
   ```

3. Deploy to Elastic Beanstalk using the AWS CLI:

   ```bash
   aws elasticbeanstalk create-application-version --application-name codereview-backend --version-label manual-deploy-$(date +%Y%m%d%H%M%S) --source-bundle S3Bucket=your-deployment-bucket,S3Key=dist.zip
   aws elasticbeanstalk update-environment --application-name codereview-backend --environment-name codereview-backend-env --version-label manual-deploy-$(date +%Y%m%d%H%M%S)
   ```

#### Environment Variables

Configure the following environment variables in Elastic Beanstalk:

- `PORT`: 8080 (default for Elastic Beanstalk)
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secure JWT signing key
- `JWT_EXPIRATION`: Token expiration period
- `S3_ACCESS_KEY`: AWS S3 access key
- `S3_SECRET_KEY`: AWS S3 secret key
- `S3_BUCKET_NAME`: AWS S3 bucket name
- `S3_REGION`: AWS S3 region
- `FRONTEND_URL`: URL of the frontend service on CloudFront
- `EMAIL_SERVICE`: Email service provider
- `EMAIL_HOST`: SMTP host
- `EMAIL_PORT`: SMTP port
- `EMAIL_USER`: SMTP username
- `EMAIL_PASS`: SMTP password
- `EMAIL_FROM`: From email address
- `NODE_ENV`: Set to `production` for deployment

### Railway Deployment

This project is also configured for deployment on Railway. When you push changes to the main branch, Railway will automatically build and deploy the application.

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
