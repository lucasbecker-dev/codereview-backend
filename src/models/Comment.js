const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
        },
        text: {
            type: String,
            required: [true, 'Reply text is required'],
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }
);

const commentSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project is required'],
        },
        file: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File',
            required: [true, 'File is required'],
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
        },
        lineNumber: {
            type: Number,
            required: [true, 'Line number is required'],
        },
        text: {
            type: String,
            required: [true, 'Comment text is required'],
            trim: true,
        },
        replies: [replySchema],
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
commentSchema.index({ project: 1 });
commentSchema.index({ file: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ lineNumber: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment; 