const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Cohort = require('../models/Cohort');
const Project = require('../models/Project');
const { body } = require('express-validator');

/**
 * Validation rules for assignment creation
 */
const assignmentValidationRules = [
    body('reviewer')
        .notEmpty().withMessage('Reviewer ID is required')
        .isMongoId().withMessage('Invalid reviewer ID format'),

    body('assignmentType')
        .notEmpty().withMessage('Assignment type is required')
        .isIn(['cohort', 'student', 'project']).withMessage('Invalid assignment type'),

    body('assignedTo')
        .notEmpty().withMessage('Assignment target ID is required')
        .isMongoId().withMessage('Invalid assignment target ID format'),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean value')
];

/**
 * Get all assignments with filtering and sorting
 * @route GET /api/assignments
 * @access Private (Admin, SuperAdmin)
 */
const getAssignments = async (req, res) => {
    try {
        const {
            reviewer,
            assignmentType,
            assignedTo,
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        // Build filter object
        const filter = {};

        if (reviewer) {
            filter.reviewer = reviewer;
        }

        if (assignmentType) {
            filter.assignmentType = assignmentType;
        }

        if (assignedTo) {
            filter.assignedTo = assignedTo;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const assignments = await Assignment.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('reviewer', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .populate({
                path: 'assignedTo',
                select: 'name firstName lastName title',
                // This will populate based on the model type
                refPath: 'assignmentTypeModel'
            });

        // Get total count for pagination
        const total = await Assignment.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: assignments.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: assignments
        });
    } catch (error) {
        console.error('Error in getAssignments:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get assignments for a specific reviewer
 * @route GET /api/reviewers/:id/assignments
 * @access Private (Reviewer, Admin, SuperAdmin)
 */
const getReviewerAssignments = async (req, res) => {
    try {
        const {
            assignmentType,
            isActive = 'true',
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        // Build filter object
        const filter = {
            reviewer: req.params.id,
            isActive: isActive === 'true'
        };

        if (assignmentType) {
            filter.assignmentType = assignmentType;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const assignments = await Assignment.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('reviewer', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .populate({
                path: 'assignedTo',
                select: 'name firstName lastName title',
                refPath: 'assignmentTypeModel'
            });

        // Get total count for pagination
        const total = await Assignment.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: assignments.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: assignments
        });
    } catch (error) {
        console.error('Error in getReviewerAssignments:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Create a new assignment
 * @route POST /api/assignments
 * @access Private (Admin, SuperAdmin)
 */
const createAssignment = async (req, res) => {
    try {
        const { reviewer, assignmentType, assignedTo, isActive } = req.body;

        // Verify that reviewer exists and has reviewer role
        const reviewerUser = await User.findById(reviewer);
        if (!reviewerUser) {
            return res.status(404).json({
                message: 'Reviewer not found'
            });
        }

        if (reviewerUser.role !== 'reviewer' && reviewerUser.role !== 'admin') {
            return res.status(400).json({
                message: 'Assigned user must have reviewer or admin role'
            });
        }

        // Verify that the assigned entity exists based on assignment type
        let assignmentTypeModel;
        if (assignmentType === 'cohort') {
            assignmentTypeModel = 'Cohort';
            const cohort = await Cohort.findById(assignedTo);
            if (!cohort) {
                return res.status(404).json({
                    message: 'Cohort not found'
                });
            }
        } else if (assignmentType === 'student') {
            assignmentTypeModel = 'User';
            const student = await User.findById(assignedTo);
            if (!student) {
                return res.status(404).json({
                    message: 'Student not found'
                });
            }
            if (student.role !== 'student') {
                return res.status(400).json({
                    message: 'Assigned user must have student role'
                });
            }
        } else if (assignmentType === 'project') {
            assignmentTypeModel = 'Project';
            const project = await Project.findById(assignedTo);
            if (!project) {
                return res.status(404).json({
                    message: 'Project not found'
                });
            }
        }

        // Check for duplicate assignment
        const existingAssignment = await Assignment.findOne({
            reviewer,
            assignmentType,
            assignedTo,
            isActive: true
        });

        if (existingAssignment) {
            return res.status(400).json({
                message: 'This assignment already exists and is active'
            });
        }

        // Create new assignment
        const assignment = new Assignment({
            reviewer,
            assignmentType,
            assignedTo,
            assignmentTypeModel,
            createdBy: req.user.id,
            isActive: isActive !== undefined ? isActive : true
        });

        // Save assignment
        await assignment.save();

        // If assignment is to a cohort, update the cohort's assignedReviewers
        if (assignmentType === 'cohort' && isActive !== false) {
            await Cohort.findByIdAndUpdate(
                assignedTo,
                { $addToSet: { assignedReviewers: reviewer } }
            );
        }

        // Return created assignment with populated fields
        const createdAssignment = await Assignment.findById(assignment._id)
            .populate('reviewer', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .populate({
                path: 'assignedTo',
                select: 'name firstName lastName title',
                refPath: 'assignmentTypeModel'
            });

        res.status(201).json({
            success: true,
            data: createdAssignment
        });
    } catch (error) {
        console.error('Error in createAssignment:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Update an assignment (activate/deactivate)
 * @route PUT /api/assignments/:id
 * @access Private (Admin, SuperAdmin)
 */
const updateAssignment = async (req, res) => {
    try {
        const { isActive } = req.body;

        // Find assignment
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({
                message: 'Assignment not found'
            });
        }

        // Update assignment
        assignment.isActive = isActive !== undefined ? isActive : assignment.isActive;
        await assignment.save();

        // If assignment is to a cohort, update the cohort's assignedReviewers
        if (assignment.assignmentType === 'cohort') {
            if (isActive) {
                // Add reviewer to cohort's assignedReviewers
                await Cohort.findByIdAndUpdate(
                    assignment.assignedTo,
                    { $addToSet: { assignedReviewers: assignment.reviewer } }
                );
            } else {
                // Remove reviewer from cohort's assignedReviewers
                await Cohort.findByIdAndUpdate(
                    assignment.assignedTo,
                    { $pull: { assignedReviewers: assignment.reviewer } }
                );
            }
        }

        // Return updated assignment with populated fields
        const updatedAssignment = await Assignment.findById(req.params.id)
            .populate('reviewer', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .populate({
                path: 'assignedTo',
                select: 'name firstName lastName title',
                refPath: 'assignmentTypeModel'
            });

        res.status(200).json({
            success: true,
            data: updatedAssignment
        });
    } catch (error) {
        console.error('Error in updateAssignment:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Delete an assignment
 * @route DELETE /api/assignments/:id
 * @access Private (Admin, SuperAdmin)
 */
const deleteAssignment = async (req, res) => {
    try {
        // Find assignment
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({
                message: 'Assignment not found'
            });
        }

        // If assignment is to a cohort and is active, update the cohort's assignedReviewers
        if (assignment.assignmentType === 'cohort' && assignment.isActive) {
            await Cohort.findByIdAndUpdate(
                assignment.assignedTo,
                { $pull: { assignedReviewers: assignment.reviewer } }
            );
        }

        // Delete assignment
        await Assignment.deleteOne({ _id: assignment._id });

        res.status(200).json({
            success: true,
            message: 'Assignment deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteAssignment:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getAssignments,
    getReviewerAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    assignmentValidationRules
}; 