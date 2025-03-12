const Project = require('../models/Project');
const User = require('../models/User');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Create a new project
 * @route POST /api/projects
 * @access Private (Student)
 */
exports.createProject = catchAsync(async (req, res) => {
    const { title, description, tags } = req.body;

    // Create project with student as the current user
    const project = await Project.create({
        title,
        description,
        student: req.user.id,
        tags: tags || [],
    });

    // Find reviewers assigned to the student's cohort
    if (req.user.cohort) {
        const user = await User.findById(req.user.id).populate('cohort');
        if (user.cohort && user.cohort.assignedReviewers && user.cohort.assignedReviewers.length > 0) {
            project.reviewers = user.cohort.assignedReviewers;
            await project.save();
        }
    }

    res.status(201).json({
        success: true,
        data: project,
    });
});

/**
 * Get all projects with filtering and sorting
 * @route GET /api/projects
 * @access Private
 */
exports.getProjects = catchAsync(async (req, res) => {
    let query = {};

    // Filter by student (if reviewer or admin)
    if (req.query.student) {
        query.student = req.query.student;
    }

    // Filter by reviewer (if student or admin)
    if (req.query.reviewer) {
        query.reviewers = req.query.reviewer;
    }

    // Filter by status
    if (req.query.status) {
        query.status = req.query.status;
    }

    // Filter by tags
    if (req.query.tags) {
        const tags = req.query.tags.split(',');
        query.tags = { $in: tags };
    }

    // If user is a student, only show their projects
    if (req.user.role === 'student') {
        query.student = req.user.id;
    }

    // If user is a reviewer, only show projects they're assigned to
    if (req.user.role === 'reviewer') {
        query.reviewers = req.user.id;
    }

    // Build the query
    let queryBuilder = Project.find(query);

    // Populate student and reviewers
    queryBuilder = queryBuilder.populate('student', 'firstName lastName email')
        .populate('reviewers', 'firstName lastName email');

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        queryBuilder = queryBuilder.sort(sortBy);
    } else {
        queryBuilder = queryBuilder.sort('-submissionDate');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    queryBuilder = queryBuilder.skip(startIndex).limit(limit);

    // Execute query
    const projects = await queryBuilder;

    // Get total count for pagination
    const total = await Project.countDocuments(query);

    res.status(200).json({
        success: true,
        count: projects.length,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
        },
        data: projects,
    });
});

/**
 * Get a single project
 * @route GET /api/projects/:id
 * @access Private
 */
exports.getProject = catchAsync(async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate('student', 'firstName lastName email')
        .populate('reviewers', 'firstName lastName email')
        .populate('files');

    if (!project) {
        return res.status(404).json({
            success: false,
            error: 'Project not found',
        });
    }

    // Check if user has access to this project
    if (
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        project.student._id.toString() !== req.user.id &&
        !project.reviewers.some(reviewer => reviewer._id.toString() === req.user.id)
    ) {
        return res.status(403).json({
            success: false,
            error: 'Not authorized to access this project',
        });
    }

    res.status(200).json({
        success: true,
        data: project,
    });
});

/**
 * Update a project
 * @route PUT /api/projects/:id
 * @access Private (Student who owns the project)
 */
exports.updateProject = catchAsync(async (req, res) => {
    let project = await Project.findById(req.params.id);

    if (!project) {
        return res.status(404).json({
            success: false,
            error: 'Project not found',
        });
    }

    // Check if user is the project owner
    if (project.student.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            error: 'Not authorized to update this project',
        });
    }

    // Only allow updating certain fields
    const { title, description, tags } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags;

    project = await Project.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: project,
    });
});

/**
 * Update project status
 * @route PUT /api/projects/:id/status
 * @access Private (Reviewer assigned to the project)
 */
exports.updateProjectStatus = catchAsync(async (req, res) => {
    const { status } = req.body;

    if (!status || !['pending', 'accepted', 'revision_requested'].includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid status',
        });
    }

    let project = await Project.findById(req.params.id);

    if (!project) {
        return res.status(404).json({
            success: false,
            error: 'Project not found',
        });
    }

    // Check if user is a reviewer for this project
    if (
        !project.reviewers.includes(req.user.id) &&
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin'
    ) {
        return res.status(403).json({
            success: false,
            error: 'Not authorized to update this project status',
        });
    }

    project.status = status;
    await project.save();

    res.status(200).json({
        success: true,
        data: project,
    });
});

/**
 * Add feedback to a project
 * @route POST /api/projects/:id/feedback
 * @access Private (Reviewer assigned to the project)
 */
exports.addFeedback = catchAsync(async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({
            success: false,
            error: 'Feedback text is required',
        });
    }

    let project = await Project.findById(req.params.id);

    if (!project) {
        return res.status(404).json({
            success: false,
            error: 'Project not found',
        });
    }

    // Check if user is a reviewer for this project
    if (
        !project.reviewers.includes(req.user.id) &&
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin'
    ) {
        return res.status(403).json({
            success: false,
            error: 'Not authorized to add feedback to this project',
        });
    }

    project.feedback = {
        text,
        reviewer: req.user.id,
    };

    await project.save();

    res.status(200).json({
        success: true,
        data: project,
    });
}); 