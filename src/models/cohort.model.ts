import mongoose, { Document, Schema } from 'mongoose';

// Cohort document interface
export interface ICohort extends Document {
    name: string;
    startDate: Date;
    endDate: Date;
    students: mongoose.Types.ObjectId[];
    assignedReviewers: mongoose.Types.ObjectId[];
    isActive: boolean;
}

// Cohort schema
const cohortSchema = new Schema<ICohort>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        students: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        assignedReviewers: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Validate that endDate is after startDate
cohortSchema.pre('validate', function (next) {
    if (this.endDate <= this.startDate) {
        this.invalidate('endDate', 'End date must be after start date');
    }
    next();
});

const Cohort = mongoose.model<ICohort>('Cohort', cohortSchema);

export default Cohort; 