const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Cohort name is required'],
            trim: true,
            unique: true,
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        students: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        assignedReviewers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Virtual to check if cohort is current
cohortSchema.virtual('isCurrent').get(function () {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
});

// Indexes for faster queries
cohortSchema.index({ isActive: 1 });
cohortSchema.index({ startDate: 1, endDate: 1 });

const Cohort = mongoose.model('Cohort', cohortSchema);

module.exports = Cohort; 