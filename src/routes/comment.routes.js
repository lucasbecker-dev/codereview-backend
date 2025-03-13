const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    addComment,
    getFileComments,
    getProjectComments,
    addReply,
    deleteComment,
    deleteReply
} = require('../controllers/comment.controller');

// Base routes
router.post('/', protect, addComment);
router.delete('/:commentId', protect, deleteComment);

// Reply routes
router.post('/:commentId/replies', protect, addReply);
router.delete('/:commentId/replies/:replyId', protect, deleteReply);

module.exports = router; 