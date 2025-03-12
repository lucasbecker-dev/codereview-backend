const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Feedback text is required'],
        },
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reviewer is required'],
        },
    },
    {
        timestamps: true,
    }
);

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Project title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Project description is required'],
            trim: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student is required'],
        },
        reviewers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        status: {
            type: String,
            enum: ['pending', 'accepted', 'revision_requested'],
            default: 'pending',
        },
        submissionDate: {
            type: Date,
            default: Date.now,
        },
        feedback: feedbackSchema,
        files: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'File',
            },
        ],
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for lastUpdated
projectSchema.virtual('lastUpdated').get(function () {
    return this.updatedAt;
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 