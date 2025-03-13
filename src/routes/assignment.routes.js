const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { validate } = require('../middleware/validation');
const {
    getAssignments,
    getReviewerAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    assignmentValidationRules
} = require('../controllers/assignment.controller');

// Get all assignments - Admin and SuperAdmin only
router.get('/', protect, authorize(['admin', 'superadmin']), getAssignments);

// Create assignment - Admin and SuperAdmin only
router.post(
    '/',
    protect,
    authorize(['admin', 'superadmin']),
    validate(assignmentValidationRules),
    createAssignment
);

// Update assignment - Admin and SuperAdmin only
router.put(
    '/:id',
    protect,
    authorize(['admin', 'superadmin']),
    updateAssignment
);

// Delete assignment - Admin and SuperAdmin only
router.delete(
    '/:id',
    protect,
    authorize(['admin', 'superadmin']),
    deleteAssignment
);

// Get assignments for a specific reviewer
// Accessible by the reviewer themselves, admins, and superadmins
router.get(
    '/reviewers/:id',
    protect,
    (req, res, next) => {
        // Allow access if user is the reviewer or has admin/superadmin role
        if (
            req.user.id === req.params.id ||
            ['admin', 'superadmin'].includes(req.user.role)
        ) {
            return next();
        }
        return res.status(403).json({
            message: 'Not authorized to access this resource'
        });
    },
    getReviewerAssignments
);

module.exports = router; 