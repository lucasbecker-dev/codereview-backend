const Comment = require('../models/Comment');
const Project = require('../models/Project');
const File = require('../models/File');
const User = require('../models/User');
const { createNotification } = require('../services/notification.service');
const mongoose = require('mongoose');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../utils/errors');

/**
 * @desc    Add a comment to a file
 * @route   POST /api/comments
 * @access  Private
 */
exports.addComment = async (req, res, next) => {
    try {
        const { projectId, fileId, lineNumber, text } = req.body;

        if (!projectId || !fileId || !lineNumber || !text) {
            throw new BadRequestError('Project ID, file ID, line number, and text are required');
        }

        // Validate project exists
        const project = await Project.findById(projectId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }

        // Validate file exists and belongs to the project
        const file = await File.findOne({ _id: fileId, project: projectId });
        if (!file) {
            throw new NotFoundError('File not found or does not belong to the project');
        }

        // Create comment
        const comment = await Comment.create({
            project: projectId,
            file: fileId,
            author: req.user.id,
            lineNumber,
            text,
            replies: []
        });

        // Populate author details
        await comment.populate('author', 'firstName lastName email profilePicture');

        // Create notification for project owner if the commenter is not the owner
        if (project.student.toString() !== req.user.id) {
            await createNotification({
                recipient: project.student,
                type: 'newComment',
                content: `${req.user.firstName} ${req.user.lastName} commented on your project "${project.title}"`,
                relatedResource: {
                    type: 'comment',
                    id: comment._id
                }
            });
        }

        // Create notifications for reviewers
        if (project.reviewers && project.reviewers.length > 0) {
            for (const reviewer of project.reviewers) {
                // Don't notify the commenter
                if (reviewer.toString() !== req.user.id) {
                    await createNotification({
                        recipient: reviewer,
                        type: 'newComment',
                        content: `${req.user.firstName} ${req.user.lastName} commented on project "${project.title}"`,
                        relatedResource: {
                            type: 'comment',
                            id: comment._id
                        }
                    });
                }
            }
        }

        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all comments for a file
 * @route   GET /api/files/:fileId/comments
 * @access  Private
 */
exports.getFileComments = async (req, res, next) => {
    try {
        const { fileId } = req.params;

        // Validate file exists
        const file = await File.findById(fileId);
        if (!file) {
            throw new NotFoundError('File not found');
        }

        // Get comments for the file
        const comments = await Comment.find({ file: fileId })
            .populate('author', 'firstName lastName email profilePicture')
            .populate('replies.author', 'firstName lastName email profilePicture')
            .sort({ lineNumber: 1, createdAt: 1 });

        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all comments for a project
 * @route   GET /api/projects/:projectId/comments
 * @access  Private
 */
exports.getProjectComments = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // Validate project exists
        const project = await Project.findById(projectId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }

        // Get comments for the project
        const comments = await Comment.find({ project: projectId })
            .populate('author', 'firstName lastName email profilePicture')
            .populate('replies.author', 'firstName lastName email profilePicture')
            .populate('file', 'filename path')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add a reply to a comment
 * @route   POST /api/comments/:commentId/replies
 * @access  Private
 */
exports.addReply = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { text } = req.body;

        if (!text) {
            throw new BadRequestError('Reply text is required');
        }

        // Validate comment exists
        const comment = await Comment.findById(commentId);
        if (!comment) {
            throw new NotFoundError('Comment not found');
        }

        // Create reply
        const reply = {
            author: req.user.id,
            text,
            createdAt: Date.now()
        };

        // Add reply to comment
        comment.replies.push(reply);
        await comment.save();

        // Populate author details for the new reply
        await comment.populate('replies.author', 'firstName lastName email profilePicture');

        // Get the project for notification
        const project = await Project.findById(comment.project);

        // Create notification for comment author if the replier is not the author
        if (comment.author.toString() !== req.user.id) {
            await createNotification({
                recipient: comment.author,
                type: 'newComment',
                content: `${req.user.firstName} ${req.user.lastName} replied to your comment on project "${project.title}"`,
                relatedResource: {
                    type: 'comment',
                    id: comment._id
                }
            });
        }

        res.status(201).json({
            success: true,
            data: comment.replies[comment.replies.length - 1]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:commentId
 * @access  Private
 */
exports.deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;

        // Validate comment exists
        const comment = await Comment.findById(commentId);
        if (!comment) {
            throw new NotFoundError('Comment not found');
        }

        // Check if user is the author of the comment
        if (comment.author.toString() !== req.user.id) {
            throw new UnauthorizedError('Not authorized to delete this comment');
        }

        // Delete comment
        await Comment.findByIdAndDelete(commentId);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a reply
 * @route   DELETE /api/comments/:commentId/replies/:replyId
 * @access  Private
 */
exports.deleteReply = async (req, res, next) => {
    try {
        const { commentId, replyId } = req.params;

        // Validate comment exists
        const comment = await Comment.findById(commentId);
        if (!comment) {
            throw new NotFoundError('Comment not found');
        }

        // Find the reply
        const reply = comment.replies.id(replyId);
        if (!reply) {
            throw new NotFoundError('Reply not found');
        }

        // Check if user is the author of the reply
        if (reply.author.toString() !== req.user.id) {
            throw new UnauthorizedError('Not authorized to delete this reply');
        }

        // Remove reply
        comment.replies.pull(replyId);
        await comment.save();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
}; 