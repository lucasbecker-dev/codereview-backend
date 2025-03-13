# Scripts Directory Documentation

This document explains the organization of the scripts directory and how to use the available scripts.

## Overview

The scripts directory contains utility scripts for development, testing, and maintenance of the CodeReview Platform backend. These scripts have been reorganized to eliminate redundancy and improve maintainability.

## Available Scripts

### Development Scripts

- **freshStart.js**: Drops the database and starts the server with a clean slate

  ```
  npm run fresh
  ```

- **dropDatabase.js**: Drops the database without starting the server

  ```
  npm run drop-db
  ```

### User Management Scripts

- **findUsers.js**: Finds user information by email

  ```
  npm run find-users
  ```

- **verifyUsers.js**: Verifies users by ID or email

  ```
  # Verify default test users
  npm run verify-users
  
  # Verify specific users by email
  npm run verify-users test@example.com admin@example.com
  
  # Verify specific users by ID
  npm run verify-users 60a1b2c3d4e5f6g7h8i9j0k1
  ```

### Email Testing Scripts

- **testEmailIntegration.js**: Comprehensive script to test email functionality

  ```
  npm run test-email-integration
  ```

## Test Suite

The following Jest test suites have been created or enhanced to replace redundant scripts:

- **user.test.js**: Tests user management functionality

  ```
  npm run test:user
  ```

- **project.test.js**: Tests project management functionality

  ```
  npm run test:project
  ```

- **comment.test.js**: Tests comment functionality

  ```
  npm run test:comment
  ```

- **auth.test.js**: Tests authentication functionality

  ```
  npm run test:auth
  ```

- **email.service.test.js**: Tests email service functionality

  ```
  npm run test:email
  ```

- **cohort.test.js**: Tests cohort management functionality

  ```
  npm run test:cohort
  ```

- **assignment.test.js**: Tests assignment functionality

  ```
  npm run test:assignment
  ```

## Running All Tests

To run all tests:

```
npm test
```

## Removed Scripts

The following scripts have been removed or consolidated:

- `testProjectAPI.js` and `testProjectEndpoints.js`: Functionality moved to `project.test.js`
- `testCommentAPI.js`: Functionality moved to `comment.test.js`
- `testUserAPI.js`: Functionality moved to `user.test.js`
- `verifyTestUser.js`: Consolidated into `verifyUsers.js`
- `testEmail.js`, `testTemplates.js`, and `testAuthEmail.js`: Consolidated into `testEmailIntegration.js`
