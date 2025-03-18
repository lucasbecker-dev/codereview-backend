import express from 'express';
import {
    getAllAssignments,
    createAssignment,
    removeAssignment,
    getReviewerAssignments
} from '../controllers/assignment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Get all assignments (admin only)
router.get(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    getAllAssignments
);

// Create assignment (admin only)
router.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    createAssignment
);

// Remove assignment (admin only)
router.delete(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    removeAssignment
);

// Get reviewer's assignments
router.get('/reviewers/:id/assignments', authenticate, getReviewerAssignments);

export default router; 