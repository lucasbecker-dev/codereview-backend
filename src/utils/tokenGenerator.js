const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Generate a JWT token for authentication
 * @param {string} id - User ID to include in the token
 * @returns {string} JWT token
 */
const generateJWT = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });
};

/**
 * Generate a random token for verification or password reset
 * @param {number} [bytes=32] - Number of bytes for the token
 * @returns {string} - Random token
 */
const generateToken = (bytes = 32) => {
    return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate a verification token with expiry
 * @param {number} [expiryHours=24] - Token expiry in hours
 * @returns {Object} - Token and expiry date
 */
const generateVerificationToken = (expiryHours = 24) => {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    return {
        token,
        expiresAt
    };
};

/**
 * Generate a password reset token with expiry
 * @param {number} [expiryHours=1] - Token expiry in hours
 * @returns {Object} - Token and expiry date
 */
const generatePasswordResetToken = (expiryHours = 1) => {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    return {
        token,
        expiresAt
    };
};

/**
 * Check if a token is expired
 * @param {Date} expiryDate - Token expiry date
 * @returns {boolean} - True if token is expired
 */
const isTokenExpired = (expiryDate) => {
    return new Date() > new Date(expiryDate);
};

/**
 * Generate a hashed token for secure storage in the database
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate an expiration date for tokens
 * @param {number} hours - Number of hours until expiration
 * @returns {Date} Expiration date
 */
const generateExpirationDate = (hours = 24) => {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
};

module.exports = {
    generateJWT,
    generateVerificationToken,
    generatePasswordResetToken,
    isTokenExpired,
    hashToken,
    generateExpirationDate,
}; 