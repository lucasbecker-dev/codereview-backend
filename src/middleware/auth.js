const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check if user is authenticated
exports.isAuthenticated = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required. No token provided.' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Find user by ID
        const user = await User.findById(decoded.userId).select('-password -verificationToken');
        if (!user) {
            return res.status(401).json({ message: 'User not found or token is invalid' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Your account has been deactivated' });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        next(error);
    }
};

// Middleware to check if user is admin
exports.isAdmin = async (req, res, next) => {
    try {
        // First check if user is authenticated
        await exports.isAuthenticated(req, res, () => {
            // Check if user is admin or superadmin
            if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
                next();
            } else {
                res.status(403).json({ message: 'Access denied. Admin privileges required.' });
            }
        });
    } catch (error) {
        next(error);
    }
};

// Middleware to check if user is superadmin
exports.isSuperAdmin = async (req, res, next) => {
    try {
        // First check if user is authenticated
        await exports.isAuthenticated(req, res, () => {
            // Check if user is superadmin
            if (req.user && req.user.role === 'superadmin') {
                next();
            } else {
                res.status(403).json({ message: 'Access denied. Super admin privileges required.' });
            }
        });
    } catch (error) {
        next(error);
    }
};

// Middleware to check if user is reviewer
exports.isReviewer = async (req, res, next) => {
    try {
        // First check if user is authenticated
        await exports.isAuthenticated(req, res, () => {
            // Check if user is reviewer, admin, or superadmin
            if (req.user && (req.user.role === 'reviewer' || req.user.role === 'admin' || req.user.role === 'superadmin')) {
                next();
            } else {
                res.status(403).json({ message: 'Access denied. Reviewer privileges required.' });
            }
        });
    } catch (error) {
        next(error);
    }
};

// Middleware to check if user is the owner of the resource or has admin privileges
exports.isOwnerOrAdmin = (paramIdField) => {
    return async (req, res, next) => {
        try {
            // First check if user is authenticated
            await exports.isAuthenticated(req, res, () => {
                const resourceId = req.params[paramIdField];

                // Check if user is the owner or has admin privileges
                if (
                    req.user && (
                        req.user._id.toString() === resourceId ||
                        req.user.role === 'admin' ||
                        req.user.role === 'superadmin'
                    )
                ) {
                    next();
                } else {
                    res.status(403).json({ message: 'Access denied. You do not have permission to access this resource.' });
                }
            });
        } catch (error) {
            next(error);
        }
    };
}; 