import mongoose, { Document, Schema } from 'mongoose';

// Assignment types enum
export enum AssignmentType {
    COHORT = 'cohort',
    STUDENT = 'student',
    PROJECT = 'project'
}

// Assignment document interface
export interface IAssignment extends Document {
    reviewer: mongoose.Types.ObjectId;
    assignmentType: AssignmentType;
    assignedTo: mongoose.Types.ObjectId;
    createdAt: Date;
    createdBy: mongoose.Types.ObjectId;
    isActive: boolean;
}

// Assignment schema
const assignmentSchema = new Schema(
    {
        reviewer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        assignmentType: {
            type: String,
            enum: Object.values(AssignmentType),
            required: true
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            required: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Add virtual getter to determine the reference model based on assignmentType
assignmentSchema.virtual('referenceModel').get(function () {
    switch (this.assignmentType) {
        case AssignmentType.COHORT:
            return 'Cohort';
        case AssignmentType.STUDENT:
            return 'User';
        case AssignmentType.PROJECT:
            return 'Project';
        default:
            return 'Project';
    }
});

const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);

export default Assignment; 