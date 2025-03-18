import mongoose, { Document, Schema } from 'mongoose';

// Project status enum
export enum ProjectStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REVISION_REQUESTED = 'revision_requested'
}

// Feedback interface
interface Feedback {
    text: string;
    createdAt: Date;
    updatedAt: Date;
    reviewer: mongoose.Types.ObjectId;
}

// Project document interface
export interface IProject extends Document {
    title: string;
    description: string;
    student: mongoose.Types.ObjectId;
    reviewers: mongoose.Types.ObjectId[];
    status: ProjectStatus;
    submissionDate: Date;
    lastUpdated: Date;
    feedback?: Feedback;
    files: mongoose.Types.ObjectId[];
    tags: string[];
}

// Project schema
const projectSchema = new Schema<IProject>(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        student: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        reviewers: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        status: {
            type: String,
            enum: Object.values(ProjectStatus),
            default: ProjectStatus.PENDING,
            required: true
        },
        submissionDate: {
            type: Date,
            default: Date.now
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        feedback: {
            text: String,
            createdAt: {
                type: Date,
                default: Date.now
            },
            updatedAt: {
                type: Date,
                default: Date.now
            },
            reviewer: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        },
        files: [{
            type: Schema.Types.ObjectId,
            ref: 'File'
        }],
        tags: [String]
    },
    {
        timestamps: true
    }
);

// Update lastUpdated timestamp on every update
projectSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project; 