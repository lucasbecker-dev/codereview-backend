// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Use a separate test database
process.env.MONGODB_URI = 'mongodb://localhost:27017/codereview_test';

// Set a fixed JWT secret for tests
process.env.JWT_SECRET = 'test-jwt-secret';

// Set a shorter JWT expiration for tests
process.env.JWT_EXPIRES_IN = '1h';

// Set a test frontend URL
process.env.FRONTEND_URL = 'http://localhost:3000'; 