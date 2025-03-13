const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { validate } = require('../middleware/validation');
const {
    getCohorts,
    getCohort,
    createCohort,
    updateCohort,
    deleteCohort,
    cohortValidationRules
} = require('../controllers/cohort.controller');

// Get all cohorts - Admin and SuperAdmin only
router.get('/', protect, authorize(['admin', 'superadmin']), getCohorts);

// Get single cohort - Admin and SuperAdmin only
router.get('/:id', protect, authorize(['admin', 'superadmin']), getCohort);

// Create cohort - Admin and SuperAdmin only
router.post(
    '/',
    protect,
    authorize(['admin', 'superadmin']),
    validate(cohortValidationRules),
    createCohort
);

// Update cohort - Admin and SuperAdmin only
router.put(
    '/:id',
    protect,
    authorize(['admin', 'superadmin']),
    validate(cohortValidationRules),
    updateCohort
);

// Delete cohort - SuperAdmin only
router.delete('/:id', protect, authorize(['superadmin']), deleteCohort);

module.exports = router; 