import { Request, Response } from 'express';
import Assignment from '../models/assignment.model';
import User from '../models/user.model';
import Project from '../models/project.model';
import Cohort from '../models/cohort.model';

/**
 * Get all assignments
 * @route GET /api/assignments
 * @access Private (Admin/SuperAdmin)
 */
export const getAllAssignments = async (req: Request, res: Response) => {
    try {
        const { reviewerId, assignmentType, assignedTo, isActive } = req.query;

        let query: any = {};

        // Apply filters if provided
        if (reviewerId) query.reviewer = reviewerId;
        if (assignmentType) query.assignmentType = assignmentType;
        if (assignedTo) query.assignedTo = assignedTo;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const assignments = await Assignment.find(query)
            .populate('reviewer', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 });

        // Populate assignedTo with additional details based on assignment type
        const populatedAssignments = await Promise.all(assignments.map(async (assignment) => {
            const assignmentObj = assignment.toObject();

            if (assignment.assignmentType === 'cohort') {
                const cohort = await Cohort.findById(assignment.assignedTo)
                    .select('name startDate endDate');
                assignmentObj.assignedToDetails = cohort;
            } else if (assignment.assignmentType === 'student') {
                const student = await User.findById(assignment.assignedTo)
                    .select('firstName lastName email');
                assignmentObj.assignedToDetails = student;
            } else if (assignment.assignmentType === 'project') {
                const project = await Project.findById(assignment.assignedTo)
                    .select('title student')
                    .populate('student', 'firstName lastName email');
                assignmentObj.assignedToDetails = project;
            }

            return assignmentObj;
        }));

        return res.status(200).json({ assignments: populatedAssignments });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching assignments'
        });
    }
};

/**
 * Create assignment
 * @route POST /api/assignments
 * @access Private (Admin/SuperAdmin)
 */
export const createAssignment = async (req: Request, res: Response) => {
    try {
        const { reviewer, assignmentType, assignedTo } = req.body;

        if (!reviewer || !assignmentType || !assignedTo) {
            return res.status(400).json({
                message: 'Reviewer, assignment type, and assigned to are required'
            });
        }

        // Validate that reviewer exists and is a reviewer
        const reviewerUser = await User.findById(reviewer);
        if (!reviewerUser || reviewerUser.role !== 'reviewer') {
            return res.status(400).json({
                message: 'Invalid reviewer. User must exist and have the reviewer role'
            });
        }

        // Validate assignment type
        if (!['cohort', 'student', 'project'].includes(assignmentType)) {
            return res.status(400).json({ message: 'Invalid assignment type' });
        }

        // Validate that the assigned resource exists
        let resourceExists = false;

        if (assignmentType === 'cohort') {
            resourceExists = !!(await Cohort.findById(assignedTo));
        } else if (assignmentType === 'student') {
            const student = await User.findById(assignedTo);
            resourceExists = !!(student && student.role === 'student');
        } else if (assignmentType === 'project') {
            resourceExists = !!(await Project.findById(assignedTo));
        }

        if (!resourceExists) {
            return res.status(400).json({
                message: `Invalid ${assignmentType}. Resource does not exist`
            });
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
                message: 'An active assignment already exists for this reviewer and resource'
            });
        }

        // Create new assignment
        const assignment = new Assignment({
            reviewer,
            assignmentType,
            assignedTo,
            createdAt: new Date(),
            createdBy: req.user?._id,
            isActive: true
        });

        await assignment.save();

        // If assignment is to a project, add reviewer to project's reviewers array
        if (assignmentType === 'project') {
            await Project.findByIdAndUpdate(
                assignedTo,
                { $addToSet: { reviewers: reviewer } }
            );
        }

        // If assignment is to a cohort, add reviewer to cohort's assignedReviewers array
        if (assignmentType === 'cohort') {
            await Cohort.findByIdAndUpdate(
                assignedTo,
                { $addToSet: { assignedReviewers: reviewer } }
            );
        }

        const populatedAssignment = await Assignment.findById(assignment._id)
            .populate('reviewer', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email');

        return res.status(201).json({
            message: 'Assignment created successfully',
            assignment: populatedAssignment
        });
    } catch (error) {
        console.error('Error creating assignment:', error);
        return res.status(500).json({
            message: 'An error occurred while creating the assignment'
        });
    }
};

/**
 * Remove assignment
 * @route DELETE /api/assignments/:id
 * @access Private (Admin/SuperAdmin)
 */
export const removeAssignment = async (req: Request, res: Response) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Set assignment to inactive instead of deleting
        assignment.isActive = false;
        await assignment.save();

        // If assignment was to a project, remove reviewer from project's reviewers array
        if (assignment.assignmentType === 'project') {
            await Project.findByIdAndUpdate(
                assignment.assignedTo,
                { $pull: { reviewers: assignment.reviewer } }
            );
        }

        // If assignment was to a cohort, remove reviewer from cohort's assignedReviewers array
        if (assignment.assignmentType === 'cohort') {
            await Cohort.findByIdAndUpdate(
                assignment.assignedTo,
                { $pull: { assignedReviewers: assignment.reviewer } }
            );
        }

        return res.status(200).json({
            message: 'Assignment removed successfully'
        });
    } catch (error) {
        console.error('Error removing assignment:', error);
        return res.status(500).json({
            message: 'An error occurred while removing the assignment'
        });
    }
};

/**
 * Get reviewer's assignments
 * @route GET /api/reviewers/:id/assignments
 * @access Private
 */
export const getReviewerAssignments = async (req: Request, res: Response) => {
    try {
        const reviewerId = req.params.id;

        // Check if reviewer exists
        const reviewer = await User.findById(reviewerId);
        if (!reviewer || reviewer.role !== 'reviewer') {
            return res.status(404).json({ message: 'Reviewer not found' });
        }

        // Get all active assignments for this reviewer
        const assignments = await Assignment.find({
            reviewer: reviewerId,
            isActive: true
        })
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 });

        // Populate assignedTo with additional details based on assignment type
        const populatedAssignments = await Promise.all(assignments.map(async (assignment) => {
            const assignmentObj = assignment.toObject();

            if (assignment.assignmentType === 'cohort') {
                const cohort = await Cohort.findById(assignment.assignedTo)
                    .select('name startDate endDate students')
                    .populate('students', 'firstName lastName email');
                assignmentObj.assignedToDetails = cohort;

                // Also fetch all student projects from this cohort
                if (cohort) {
                    const studentIds = cohort.students.map(student => student._id);
                    const projects = await Project.find({
                        student: { $in: studentIds }
                    })
                        .select('title student status submissionDate lastUpdated')
                        .populate('student', 'firstName lastName email');

                    assignmentObj.relatedProjects = projects;
                }
            } else if (assignment.assignmentType === 'student') {
                const student = await User.findById(assignment.assignedTo)
                    .select('firstName lastName email');
                assignmentObj.assignedToDetails = student;

                // Also fetch all projects from this student
                const projects = await Project.find({
                    student: assignment.assignedTo
                })
                    .select('title status submissionDate lastUpdated');

                assignmentObj.relatedProjects = projects;
            } else if (assignment.assignmentType === 'project') {
                const project = await Project.findById(assignment.assignedTo)
                    .select('title student status submissionDate lastUpdated')
                    .populate('student', 'firstName lastName email');
                assignmentObj.assignedToDetails = project;
            }

            return assignmentObj;
        }));

        return res.status(200).json({ assignments: populatedAssignments });
    } catch (error) {
        console.error('Error fetching reviewer assignments:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching reviewer assignments'
        });
    }
}; 