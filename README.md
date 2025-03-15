# Code Review Platform - Backend

This repository contains the Express API backend for the Code Review Platform, a centralized environment for bootcamp students to submit coding projects and receive feedback from assigned reviewers.

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3
- **Email Service**: SendGrid or Nodemailer with SMTP

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

## API Documentation

API documentation will be available at `/api-docs` when the server is running.

## License

[MIT](LICENSE)
