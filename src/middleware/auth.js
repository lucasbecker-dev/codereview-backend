const jwt = require('jsonwebtoken');
require('dotenv').config();
const { User } = require('../models');

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token from the HttpOnly cookie or Authorization header
 * Sets req.user to the authenticated user
 */
const protect = async (req, res, next) => {
    let token;

    // Check if token exists in cookies
    if (req.cookies && req.cookies.auth_token) {
        token = req.cookies.auth_token;
    }
    // Check if token exists in Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by id and exclude password
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account is deactivated'
            });
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Not authorized, token failed'
        });
    }
};

/**
 * Middleware to restrict access to specific roles
 * Must be used after the protect middleware
 * @param {Array} roles - Array of roles allowed to access the route
 */
const authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role ${req.user.role} is not authorized to access this resource`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize }; 