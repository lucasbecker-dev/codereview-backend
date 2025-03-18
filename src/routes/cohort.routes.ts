import express from 'express';
import {
    getAllCohorts,
    createCohort,
    getCohortById,
    updateCohort
} from '../controllers/cohort.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Get all cohorts
router.get(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    getAllCohorts
);

// Create new cohort
router.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    createCohort
);

// Get cohort by ID
router.get(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    getCohortById
);

// Update cohort
router.put(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    updateCohort
);

export default router; 