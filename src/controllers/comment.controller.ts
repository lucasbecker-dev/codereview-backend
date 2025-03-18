import { Request, Response } from 'express';
import Comment from '../models/comment.model';
import Project from '../models/project.model';
import File from '../models/file.model';

/**
 * Get all comments for a project
 * @route GET /api/projects/:projectId/comments
 * @access Private
 */
export const getProjectComments = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const comments = await Comment.find({ project: projectId })
            .populate('author', 'firstName lastName email profilePicture')
            .populate('replies.author', 'firstName lastName email profilePicture')
            .populate('file', 'filename path');

        return res.status(200).json({ comments });
    } catch (error) {
        console.error('Error fetching project comments:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching comments'
        });
    }
};

/**
 * Get all comments for a file
 * @route GET /api/files/:fileId/comments
 * @access Private
 */
export const getFileComments = async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;

        // Check if file exists
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const comments = await Comment.find({ file: fileId })
            .populate('author', 'firstName lastName email profilePicture')
            .populate('replies.author', 'firstName lastName email profilePicture');

        return res.status(200).json({ comments });
    } catch (error) {
        console.error('Error fetching file comments:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching comments'
        });
    }
};

/**
 * Create a comment for a project
 * @route POST /api/projects/:projectId/comments
 * @access Private
 */
export const createComment = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { text, fileId, lineNumber } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // If fileId is provided, check if file exists and belongs to the project
        if (fileId) {
            const file = await File.findOne({ _id: fileId, project: projectId });
            if (!file) {
                return res.status(404).json({ message: 'File not found or does not belong to this project' });
            }
        }

        // Create new comment
        const comment = new Comment({
            project: projectId,
            file: fileId,
            author: req.user?._id,
            lineNumber,
            text,
            createdAt: new Date()
        });

        await comment.save();

        // Populate author details before returning
        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'firstName lastName email profilePicture');

        // TODO: Send notification to project owner and reviewers

        return res.status(201).json({
            message: 'Comment created successfully',
            comment: populatedComment
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({
            message: 'An error occurred while creating the comment'
        });
    }
};

/**
 * Add a reply to a comment
 * @route POST /api/comments/:id/replies
 * @access Private
 */
export const addReply = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Reply text is required' });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Add reply to comment
        comment.replies.push({
            author: req.user?._id,
            text,
            createdAt: new Date()
        });

        await comment.save();

        // Populate author details before returning
        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'firstName lastName email profilePicture')
            .populate('replies.author', 'firstName lastName email profilePicture');

        // TODO: Send notification to comment author and other participants

        return res.status(200).json({
            message: 'Reply added successfully',
            comment: populatedComment
        });
    } catch (error) {
        console.error('Error adding reply:', error);
        return res.status(500).json({
            message: 'An error occurred while adding the reply'
        });
    }
}; 