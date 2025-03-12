# CodeReview Platform - Backend

This repository contains the backend API for the CodeReview Platform, a comprehensive system designed to facilitate code reviews for educational institutions, coding bootcamps, and development teams.

## Overview

The CodeReview Platform backend is built with Node.js and Express, providing a RESTful API that supports all the core functionality of the platform, including:

- User authentication and authorization
- Project and file management
- Code review and commenting system
- Cohort and assignment management
- Notification system

## Tech Stack

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local storage with AWS S3 integration (planned)
- **Email Service**: Nodemailer

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

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
   NODE_ENV=development
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

## API Documentation

API documentation will be available at `/api-docs` once the server is running.

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
