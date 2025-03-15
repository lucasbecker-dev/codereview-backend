const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { errorHandler, handleUncaughtException, handleUnhandledRejection } = require('./utils/errorHandler');

// Handle uncaught exceptions
process.on('uncaughtException', handleUncaughtException);

// Load environment variables
dotenv.config();

// Import routes
const apiRoutes = require('./routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
require('./config/database');

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
})); // CORS
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Code Review Platform API' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    handleUnhandledRejection(err);
    server.close(() => {
        process.exit(1);
    });
});

module.exports = app; 