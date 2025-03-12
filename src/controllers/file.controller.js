const File = require('../models/File');
const Project = require('../models/Project');
const storageService = require('../services/storage.service');
const { catchAsync } = require('../utils/errorHandler');
const multer = require('multer');
const fs = require('fs');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

// Middleware to handle file uploads
exports.uploadMiddleware = upload.array('files', 10); // Allow up to 10 files

/**
 * Upload files to a project
 * @route POST /api/projects/:projectId/files
 * @access Private (Student who owns the project)
 */
exports.uploadFiles = catchAsync(async (req, res) => {
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);

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
            error: 'Not authorized to upload files to this project',
        });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No files uploaded',
        });
    }

    // Upload files and create file records
    const uploadedFiles = [];

    for (const file of req.files) {
        // Upload file to storage service
        const fileInfo = await storageService.uploadProjectFile(file, projectId);

        // Read file content
        let content = '';
        try {
            // Only read content for text files
            const isTextFile = file.mimetype.startsWith('text/') ||
                ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json', '.md', '.py', '.java', '.rb', '.php', '.go', '.c', '.cpp', '.cs', '.sql', '.sh', '.yml', '.yaml', '.xml', '.txt']
                    .some(ext => file.originalname.toLowerCase().endsWith(ext));

            if (isTextFile) {
                content = file.buffer.toString('utf8');
            }
        } catch (error) {
            console.error('Error reading file content:', error);
        }

        // Create file record in database
        const newFile = await File.create({
            project: projectId,
            filename: file.originalname,
            path: fileInfo.path,
            content,
            fileType: file.mimetype,
            s3Key: fileInfo.s3Key,
            language: fileInfo.language,
        });

        // Add file to project
        project.files.push(newFile._id);

        uploadedFiles.push(newFile);
    }

    // Save project with new files
    await project.save();

    res.status(201).json({
        success: true,
        count: uploadedFiles.length,
        data: uploadedFiles,
    });
});

/**
 * Get all files for a project
 * @route GET /api/projects/:projectId/files
 * @access Private
 */
exports.getProjectFiles = catchAsync(async (req, res) => {
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId)
        .populate('student', 'firstName lastName email')
        .populate('reviewers', 'firstName lastName email');

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

    // Get files for the project
    const files = await File.find({ project: projectId });

    res.status(200).json({
        success: true,
        count: files.length,
        data: files,
    });
});

/**
 * Get a single file with syntax highlighting
 * @route GET /api/files/:id
 * @access Private
 */
exports.getFile = catchAsync(async (req, res) => {
    const file = await File.findById(req.params.id).populate({
        path: 'project',
        select: 'student reviewers',
        populate: [
            { path: 'student', select: 'firstName lastName email' },
            { path: 'reviewers', select: 'firstName lastName email' }
        ]
    });

    if (!file) {
        return res.status(404).json({
            success: false,
            error: 'File not found',
        });
    }

    // Check if user has access to this file's project
    if (
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        file.project.student._id.toString() !== req.user.id &&
        !file.project.reviewers.some(reviewer => reviewer._id.toString() === req.user.id)
    ) {
        return res.status(403).json({
            success: false,
            error: 'Not authorized to access this file',
        });
    }

    res.status(200).json({
        success: true,
        data: file,
    });
});

/**
 * Get raw file content
 * @route GET /api/files/:id/raw
 * @access Private
 */
exports.getRawFileContent = catchAsync(async (req, res) => {
    const file = await File.findById(req.params.id).populate({
        path: 'project',
        select: 'student reviewers',
        populate: [
            { path: 'student', select: 'firstName lastName email' },
            { path: 'reviewers', select: 'firstName lastName email' }
        ]
    });

    if (!file) {
        return res.status(404).json({
            success: false,
            error: 'File not found',
        });
    }

    // Check if user has access to this file's project
    if (
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        file.project.student._id.toString() !== req.user.id &&
        !file.project.reviewers.some(reviewer => reviewer._id.toString() === req.user.id)
    ) {
        return res.status(403).json({
            success: false,
            error: 'Not authorized to access this file',
        });
    }

    // If content is stored in the database, return it
    if (file.content) {
        return res.status(200).send(file.content);
    }

    // Otherwise, read from the file system
    try {
        const content = await fs.promises.readFile(file.path, 'utf8');
        res.status(200).send(content);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to read file content',
        });
    }
}); 