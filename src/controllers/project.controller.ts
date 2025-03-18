import { Request, Response } from 'express';
import Project from '../models/project.model';
import User from '../models/user.model';

/**
 * Get all projects
 * @route GET /api/projects
 * @access Private
 */
export const getAllProjects = async (req: Request, res: Response) => {
    try {
        const { status, student, reviewer, tag, sortBy, sortDir } = req.query;

        let query: any = {};
        let sort: any = { submissionDate: -1 }; // Default sort by submission date descending

        // Apply filters if provided
        if (status) query.status = status;
        if (student) query.student = student;
        if (reviewer) query.reviewers = reviewer;
        if (tag) query.tags = tag;

        // Apply sorting if provided
        if (sortBy && ['submissionDate', 'title', 'lastUpdated'].includes(sortBy as string)) {
            sort = { [sortBy as string]: sortDir === 'asc' ? 1 : -1 };
        }

        const projects = await Project.find(query)
            .populate('student', 'firstName lastName email')
            .populate('reviewers', 'firstName lastName email')
            .sort(sort);

        return res.status(200).json({ projects });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching projects'
        });
    }
};

/**
 * Create new project
 * @route POST /api/projects
 * @access Private (Student)
 */
export const createProject = async (req: Request, res: Response) => {
    try {
        const { title, description, tags } = req.body;
        const student = req.user?._id;

        if (!student) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Create new project
        const project = new Project({
            title,
            description,
            student,
            tags: tags || [],
            status: 'pending',
            submissionDate: new Date(),
            lastUpdated: new Date()
        });

        await project.save();

        return res.status(201).json({
            message: 'Project created successfully',
            project
        });
    } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({
            message: 'An error occurred while creating the project'
        });
    }
};

/**
 * Get project by ID
 * @route GET /api/projects/:id
 * @access Private
 */
export const getProjectById = async (req: Request, res: Response) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('student', 'firstName lastName email')
            .populate('reviewers', 'firstName lastName email')
            .populate('files');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        return res.status(200).json({ project });
    } catch (error) {
        console.error('Error fetching project:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching the project'
        });
    }
};

/**
 * Update project
 * @route PUT /api/projects/:id
 * @access Private
 */
export const updateProject = async (req: Request, res: Response) => {
    try {
        const { title, description, tags } = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is the student who created the project
        if (req.user?._id.toString() !== project.student.toString() &&
            !req.user?.role.includes('admin')) {
            return res.status(403).json({ message: 'Not authorized to update this project' });
        }

        // Update fields if provided
        if (title) project.title = title;
        if (description) project.description = description;
        if (tags) project.tags = tags;

        project.lastUpdated = new Date();

        await project.save();

        return res.status(200).json({
            message: 'Project updated successfully',
            project
        });
    } catch (error) {
        console.error('Error updating project:', error);
        return res.status(500).json({
            message: 'An error occurred while updating the project'
        });
    }
};

/**
 * Update project status
 * @route PUT /api/projects/:id/status
 * @access Private (Reviewer, Admin)
 */
export const updateProjectStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;

        if (!status || !['pending', 'accepted', 'revision_requested'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is a reviewer assigned to this project or an admin
        const isReviewer = project.reviewers.some(reviewer =>
            reviewer.toString() === req.user?._id.toString()
        );

        if (!isReviewer && !['admin', 'superadmin'].includes(req.user?.role || '')) {
            return res.status(403).json({ message: 'Not authorized to update project status' });
        }

        project.status = status;
        project.lastUpdated = new Date();

        await project.save();

        // TODO: Send notification to student about status change

        return res.status(200).json({
            message: 'Project status updated successfully',
            project
        });
    } catch (error) {
        console.error('Error updating project status:', error);
        return res.status(500).json({
            message: 'An error occurred while updating project status'
        });
    }
};

/**
 * Add project feedback
 * @route POST /api/projects/:id/feedback
 * @access Private (Reviewer, Admin)
 */
export const addProjectFeedback = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Feedback text is required' });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is a reviewer assigned to this project or an admin
        const isReviewer = project.reviewers.some(reviewer =>
            reviewer.toString() === req.user?._id.toString()
        );

        if (!isReviewer && !['admin', 'superadmin'].includes(req.user?.role || '')) {
            return res.status(403).json({ message: 'Not authorized to add feedback' });
        }

        project.feedback = {
            text,
            createdAt: new Date(),
            updatedAt: new Date(),
            reviewer: req.user?._id
        };

        project.lastUpdated = new Date();

        await project.save();

        // TODO: Send notification to student about new feedback

        return res.status(200).json({
            message: 'Feedback added successfully',
            project
        });
    } catch (error) {
        console.error('Error adding feedback:', error);
        return res.status(500).json({
            message: 'An error occurred while adding feedback'
        });
    }
}; 