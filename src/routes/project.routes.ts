import express from 'express';
import {
    getAllProjects,
    createProject,
    getProjectById,
    updateProject,
    updateProjectStatus,
    addProjectFeedback
} from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Get all projects (with filtering)
router.get('/', authenticate, getAllProjects);

// Create new project (students only)
router.post('/', authenticate, authorize(UserRole.STUDENT), createProject);

// Get project by ID
router.get('/:id', authenticate, getProjectById);

// Update project
router.put('/:id', authenticate, updateProject);

// Update project status (reviewers and admins only)
router.put(
    '/:id/status',
    authenticate,
    authorize(UserRole.REVIEWER, UserRole.ADMIN, UserRole.SUPERADMIN),
    updateProjectStatus
);

// Add project feedback (reviewers and admins only)
router.post(
    '/:id/feedback',
    authenticate,
    authorize(UserRole.REVIEWER, UserRole.ADMIN, UserRole.SUPERADMIN),
    addProjectFeedback
);

export default router; 