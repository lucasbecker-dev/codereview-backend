import { Request, Response } from 'express';
import Cohort from '../models/cohort.model';
import User from '../models/user.model';

/**
 * Get all cohorts
 * @route GET /api/cohorts
 * @access Private (Admin/SuperAdmin)
 */
export const getAllCohorts = async (req: Request, res: Response) => {
    try {
        const { isActive, search } = req.query;

        let query: any = {};

        // Apply filters if provided
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (search) {
            query.name = new RegExp(search as string, 'i');
        }

        const cohorts = await Cohort.find(query)
            .populate('students', 'firstName lastName email')
            .populate('assignedReviewers', 'firstName lastName email')
            .sort({ startDate: -1 });

        return res.status(200).json({ cohorts });
    } catch (error) {
        console.error('Error fetching cohorts:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching cohorts'
        });
    }
};

/**
 * Create cohort
 * @route POST /api/cohorts
 * @access Private (Admin/SuperAdmin)
 */
export const createCohort = async (req: Request, res: Response) => {
    try {
        const { name, startDate, endDate, students, assignedReviewers, isActive } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Cohort name is required' });
        }

        // Check for existing cohort with the same name
        const existingCohort = await Cohort.findOne({ name });
        if (existingCohort) {
            return res.status(400).json({ message: 'Cohort with this name already exists' });
        }

        // Create new cohort
        const cohort = new Cohort({
            name,
            startDate: startDate || new Date(),
            endDate,
            students: students || [],
            assignedReviewers: assignedReviewers || [],
            isActive: isActive !== undefined ? isActive : true
        });

        await cohort.save();

        // Update student records with cohort reference
        if (students && students.length > 0) {
            await User.updateMany(
                { _id: { $in: students } },
                { cohort: cohort._id }
            );
        }

        return res.status(201).json({
            message: 'Cohort created successfully',
            cohort
        });
    } catch (error) {
        console.error('Error creating cohort:', error);
        return res.status(500).json({
            message: 'An error occurred while creating the cohort'
        });
    }
};

/**
 * Get cohort by ID
 * @route GET /api/cohorts/:id
 * @access Private (Admin/SuperAdmin)
 */
export const getCohortById = async (req: Request, res: Response) => {
    try {
        const cohort = await Cohort.findById(req.params.id)
            .populate('students', 'firstName lastName email')
            .populate('assignedReviewers', 'firstName lastName email');

        if (!cohort) {
            return res.status(404).json({ message: 'Cohort not found' });
        }

        return res.status(200).json({ cohort });
    } catch (error) {
        console.error('Error fetching cohort:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching the cohort'
        });
    }
};

/**
 * Update cohort
 * @route PUT /api/cohorts/:id
 * @access Private (Admin/SuperAdmin)
 */
export const updateCohort = async (req: Request, res: Response) => {
    try {
        const { name, startDate, endDate, students, assignedReviewers, isActive } = req.body;

        const cohort = await Cohort.findById(req.params.id);

        if (!cohort) {
            return res.status(404).json({ message: 'Cohort not found' });
        }

        // Update fields if provided
        if (name) cohort.name = name;
        if (startDate) cohort.startDate = new Date(startDate);
        if (endDate) cohort.endDate = new Date(endDate);
        if (isActive !== undefined) cohort.isActive = isActive;

        // Update students if provided
        if (students) {
            // Remove cohort reference from students that are no longer in this cohort
            const removedStudents = cohort.students.filter(id => !students.includes(id.toString()));
            if (removedStudents.length > 0) {
                await User.updateMany(
                    { _id: { $in: removedStudents } },
                    { $unset: { cohort: 1 } }
                );
            }

            // Add cohort reference to new students
            const newStudents = students.filter(id => !cohort.students.map(s => s.toString()).includes(id));
            if (newStudents.length > 0) {
                await User.updateMany(
                    { _id: { $in: newStudents } },
                    { cohort: cohort._id }
                );
            }

            cohort.students = students;
        }

        // Update assigned reviewers if provided
        if (assignedReviewers) {
            cohort.assignedReviewers = assignedReviewers;
        }

        await cohort.save();

        return res.status(200).json({
            message: 'Cohort updated successfully',
            cohort
        });
    } catch (error) {
        console.error('Error updating cohort:', error);
        return res.status(500).json({
            message: 'An error occurred while updating the cohort'
        });
    }
}; 