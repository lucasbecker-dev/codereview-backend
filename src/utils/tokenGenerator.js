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
 * Generate a random token for email verification or password reset
 * @returns {string} Random token
 */
const generateVerificationToken = () => {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');

    // Return the token
    return token;
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
    hashToken,
    generateExpirationDate,
}; 