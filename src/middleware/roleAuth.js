/**
 * Role-based authorization middleware
 * This middleware checks if the authenticated user has the required role(s)
 * to access a protected resource.
 * 
 * Must be used after the protect middleware from auth.js
 */

/**
 * Middleware to restrict access to specific roles
 * @param {Array} roles - Array of roles allowed to access the route
 * @returns {Function} Express middleware function
 */
const authorize = (roles) => {
    return (req, res, next) => {
        // Check if user exists and has a role
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                message: 'User not authenticated or role not defined'
            });
        }

        // Check if user's role is in the allowed roles array
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role ${req.user.role} is not authorized to access this resource`
            });
        }

        // User has required role, proceed to next middleware
        next();
    };
};

/**
 * Middleware to check if user is accessing their own resource
 * @param {Function} getResourceUserId - Function to extract user ID from request
 * @returns {Function} Express middleware function
 */
const isResourceOwner = (getResourceUserId) => {
    return async (req, res, next) => {
        try {
            // Get the resource owner's user ID using the provided function
            const resourceUserId = await getResourceUserId(req);

            // Check if the authenticated user is the resource owner
            if (req.user.id !== resourceUserId.toString()) {
                // Allow admins and superadmins to access any resource
                if (['admin', 'superadmin'].includes(req.user.role)) {
                    return next();
                }

                return res.status(403).json({
                    message: 'Not authorized to access this resource'
                });
            }

            next();
        } catch (error) {
            console.error('Error in isResourceOwner middleware:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    };
};

module.exports = { authorize, isResourceOwner }; 