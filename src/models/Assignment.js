const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
    {
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reviewer is required'],
        },
        assignmentType: {
            type: String,
            enum: ['cohort', 'student', 'project'],
            required: [true, 'Assignment type is required'],
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'assignmentTypeModel',
            required: [true, 'Assignment target is required'],
        },
        assignmentTypeModel: {
            type: String,
            required: true,
            enum: ['Cohort', 'User', 'Project'],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator is required'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save middleware to set the assignmentTypeModel based on assignmentType
assignmentSchema.pre('save', function (next) {
    if (this.assignmentType === 'cohort') {
        this.assignmentTypeModel = 'Cohort';
    } else if (this.assignmentType === 'student') {
        this.assignmentTypeModel = 'User';
    } else if (this.assignmentType === 'project') {
        this.assignmentTypeModel = 'Project';
    }
    next();
});

// Indexes for faster queries
assignmentSchema.index({ reviewer: 1 });
assignmentSchema.index({ assignmentType: 1 });
assignmentSchema.index({ assignedTo: 1 });
assignmentSchema.index({ isActive: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment; 