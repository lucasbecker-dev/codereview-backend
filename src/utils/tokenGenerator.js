const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generate JWT token
 * @param {Object} payload - Data to be encoded in the token
 * @param {String} expiresIn - Token expiration time
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = '30d') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate verification token
 * @param {String} userId - User ID
 * @returns {String} Verification token
 */
const generateVerificationToken = (userId) => {
    return generateToken({ userId, purpose: 'email_verification' }, '24h');
};

/**
 * Generate password reset token
 * @param {String} userId - User ID
 * @returns {String} Password reset token
 */
const generatePasswordResetToken = (userId) => {
    return generateToken({ userId, purpose: 'password_reset' }, '1h');
};

module.exports = {
    generateToken,
    generateVerificationToken,
    generatePasswordResetToken
}; 