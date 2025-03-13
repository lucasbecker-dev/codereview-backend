/**
 * Custom error classes for the application
 */

/**
 * Base error class for all application errors
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error for when a resource is not found (404)
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

/**
 * Error for bad requests (400)
 */
class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}

/**
 * Error for unauthorized access (401)
 */
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

/**
 * Error for forbidden access (403)
 */
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

/**
 * Error for validation failures (422)
 */
class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors = {}) {
        super(message, 422);
        this.errors = errors;
    }
}

/**
 * Error for conflict situations (409)
 */
class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}

/**
 * Error for rate limiting (429)
 */
class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429);
    }
}

/**
 * Error for internal server errors (500)
 */
class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500);
    }
}

module.exports = {
    AppError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ValidationError,
    ConflictError,
    TooManyRequestsError,
    InternalServerError
}; 