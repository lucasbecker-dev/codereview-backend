const Cohort = require('../models/Cohort');
const User = require('../models/User');
const { body } = require('express-validator');

/**
 * Validation rules for cohort creation and updates
 */
const cohortValidationRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Cohort name is required')
        .isLength({ max: 100 }).withMessage('Cohort name cannot exceed 100 characters'),

    body('startDate')
        .isISO8601().withMessage('Start date must be a valid date')
        .toDate(),

    body('endDate')
        .isISO8601().withMessage('End date must be a valid date')
        .toDate()
        .custom((endDate, { req }) => {
            if (endDate <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),

    body('students')
        .optional()
        .isArray().withMessage('Students must be an array'),

    body('assignedReviewers')
        .optional()
        .isArray().withMessage('Assigned reviewers must be an array'),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean value')
];

/**
 * Get all cohorts with filtering and sorting
 * @route GET /api/cohorts
 * @access Private (Admin, SuperAdmin)
 */
const getCohorts = async (req, res) => {
    try {
        const {
            name,
            isActive,
            isCurrent,
            sortBy = 'startDate',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        // Build filter object
        const filter = {};

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        if (isCurrent === 'true') {
            const now = new Date();
            filter.startDate = { $lte: now };
            filter.endDate = { $gte: now };
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const cohorts = await Cohort.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('students', 'firstName lastName email')
            .populate('assignedReviewers', 'firstName lastName email');

        // Get total count for pagination
        const total = await Cohort.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: cohorts.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: cohorts
        });
    } catch (error) {
        console.error('Error in getCohorts:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get a single cohort by ID
 * @route GET /api/cohorts/:id
 * @access Private (Admin, SuperAdmin)
 */
const getCohort = async (req, res) => {
    try {
        const cohort = await Cohort.findById(req.params.id)
            .populate('students', 'firstName lastName email')
            .populate('assignedReviewers', 'firstName lastName email');

        if (!cohort) {
            return res.status(404).json({
                message: 'Cohort not found'
            });
        }

        res.status(200).json({
            success: true,
            data: cohort
        });
    } catch (error) {
        console.error('Error in getCohort:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Create a new cohort
 * @route POST /api/cohorts
 * @access Private (Admin, SuperAdmin)
 */
const createCohort = async (req, res) => {
    try {
        const { name, startDate, endDate, students, assignedReviewers, isActive } = req.body;

        // Check if cohort with the same name already exists
        const existingCohort = await Cohort.findOne({ name });
        if (existingCohort) {
            return res.status(400).json({
                message: 'A cohort with this name already exists'
            });
        }

        // Create new cohort
        const cohort = new Cohort({
            name,
            startDate,
            endDate,
            students: students || [],
            assignedReviewers: assignedReviewers || [],
            isActive: isActive !== undefined ? isActive : true
        });

        // Save cohort
        await cohort.save();

        // If students are provided, update their cohort field
        if (students && students.length > 0) {
            await User.updateMany(
                { _id: { $in: students } },
                { cohort: cohort._id }
            );
        }

        res.status(201).json({
            success: true,
            data: cohort
        });
    } catch (error) {
        console.error('Error in createCohort:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Update a cohort
 * @route PUT /api/cohorts/:id
 * @access Private (Admin, SuperAdmin)
 */
const updateCohort = async (req, res) => {
    try {
        const { name, startDate, endDate, students, assignedReviewers, isActive } = req.body;

        // Check if cohort exists
        let cohort = await Cohort.findById(req.params.id);
        if (!cohort) {
            return res.status(404).json({
                message: 'Cohort not found'
            });
        }

        // Check if name is being changed and if it already exists
        if (name && name !== cohort.name) {
            const existingCohort = await Cohort.findOne({ name });
            if (existingCohort) {
                return res.status(400).json({
                    message: 'A cohort with this name already exists'
                });
            }
        }

        // Get previous students to handle cohort updates
        const previousStudents = [...cohort.students];

        // Update cohort
        cohort.name = name || cohort.name;
        cohort.startDate = startDate || cohort.startDate;
        cohort.endDate = endDate || cohort.endDate;
        cohort.students = students !== undefined ? students : cohort.students;
        cohort.assignedReviewers = assignedReviewers !== undefined ? assignedReviewers : cohort.assignedReviewers;
        cohort.isActive = isActive !== undefined ? isActive : cohort.isActive;

        // Save updated cohort
        await cohort.save();

        // Handle student cohort updates
        if (students !== undefined) {
            // Remove cohort reference from students no longer in the cohort
            const removedStudents = previousStudents.filter(id => !students.includes(id.toString()));
            if (removedStudents.length > 0) {
                await User.updateMany(
                    { _id: { $in: removedStudents } },
                    { $unset: { cohort: "" } }
                );
            }

            // Add cohort reference to new students
            const newStudents = students.filter(id => !previousStudents.includes(id));
            if (newStudents.length > 0) {
                await User.updateMany(
                    { _id: { $in: newStudents } },
                    { cohort: cohort._id }
                );
            }
        }

        // Return updated cohort with populated fields
        const updatedCohort = await Cohort.findById(req.params.id)
            .populate('students', 'firstName lastName email')
            .populate('assignedReviewers', 'firstName lastName email');

        res.status(200).json({
            success: true,
            data: updatedCohort
        });
    } catch (error) {
        console.error('Error in updateCohort:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Delete a cohort
 * @route DELETE /api/cohorts/:id
 * @access Private (SuperAdmin only)
 */
const deleteCohort = async (req, res) => {
    try {
        const cohort = await Cohort.findById(req.params.id);

        if (!cohort) {
            return res.status(404).json({
                message: 'Cohort not found'
            });
        }

        // Remove cohort reference from all students
        await User.updateMany(
            { cohort: cohort._id },
            { $unset: { cohort: "" } }
        );

        // Delete the cohort
        await Cohort.deleteOne({ _id: cohort._id });

        res.status(200).json({
            success: true,
            message: 'Cohort deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteCohort:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getCohorts,
    getCohort,
    createCohort,
    updateCohort,
    deleteCohort,
    cohortValidationRules
}; 