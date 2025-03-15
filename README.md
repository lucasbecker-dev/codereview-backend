# Code Review Platform - Backend

This repository contains the Express API backend for the Code Review Platform, a centralized environment for bootcamp students to submit coding projects and receive feedback from assigned reviewers.

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3
- **Email Service**: SendGrid or Nodemailer with SMTP
- **Notification System**: Server-Sent Events or WebSockets

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd code-review-platform-backend
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/code-review-platform
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@codereview.com
```

4. Start the development server

```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── app.js          # Express app
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and receive JWT
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/verify/:token` - Verify email address
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password/:token` - Reset password with token

### Users

- `GET /api/users` - Get all users (with filtering and sorting)
- `GET /api/users/:id` - Get specific user profile
- `PUT /api/users/:id` - Update user
- `GET /api/users/:id/projects` - Get user's projects

### Projects

- `GET /api/projects` - Get all projects (with filtering and sorting)
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `PUT /api/projects/:id/status` - Update project status

### Files

- `GET /api/projects/:projectId/files` - Get all files for a project
- `POST /api/projects/:projectId/files` - Upload file(s)
- `GET /api/files/:id` - Get specific file with syntax highlighting

### Comments

- `GET /api/projects/:projectId/comments` - Get all comments for a project
- `POST /api/projects/:projectId/comments` - Create a comment
- `GET /api/files/:fileId/comments` - Get all comments for a file
- `POST /api/comments/:id/replies` - Add reply to comment

## License

[MIT](LICENSE)
