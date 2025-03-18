import express from 'express';
import {
    getProjectComments,
    getFileComments,
    createComment,
    addReply
} from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Project comments routes
router.get('/projects/:projectId/comments', authenticate, getProjectComments);
router.post('/projects/:projectId/comments', authenticate, createComment);

// File comments routes
router.get('/files/:fileId/comments', authenticate, getFileComments);

// Comment replies routes
router.post('/comments/:id/replies', authenticate, addReply);

export default router; 