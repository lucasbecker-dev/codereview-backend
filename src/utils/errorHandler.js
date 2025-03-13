const { AppError } = require('./errors');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async error handler wrapper
 * Wraps async controller functions to catch errors and pass them to the error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Global error handling middleware
 * Handles all errors thrown in the application
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', err);

    // Check if error is an operational error (our custom AppError)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.errors && { errors: err.errors })
        });
    }

    // Check if error is a Multer error
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
        });
    }

    // Check if error is a validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: err.message
        });
    }

    // Check if error is a MongoDB duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'Duplicate key error',
            error: 'A record with that value already exists'
        });
    }

    // Check if error is a JWT error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: err.message
        });
    }

    // Check if error is a JWT expired error
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired',
            error: err.message
        });
    }

    // Check if error is a cast error (invalid MongoDB ID)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            error: err.message
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server error',
        error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.stack
    });
};

module.exports = {
    ApiError,
    catchAsync,
    errorHandler
}; 