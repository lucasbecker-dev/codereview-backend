import mongoose, { Document, Schema } from 'mongoose';

// Notification types enum
export enum NotificationType {
    PROJECT_STATUS = 'projectStatus',
    NEW_COMMENT = 'newComment',
    NEW_ASSIGNMENT = 'newAssignment',
    NEW_SUBMISSION = 'newSubmission'
}

// Related resource types enum
export enum ResourceType {
    PROJECT = 'project',
    COMMENT = 'comment',
    ASSIGNMENT = 'assignment'
}

// Related resource interface
interface RelatedResource {
    type: ResourceType;
    id: mongoose.Types.ObjectId;
}

// Notification document interface
export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    type: NotificationType;
    content: string;
    relatedResource: RelatedResource;
    isRead: boolean;
    createdAt: Date;
    emailSent: boolean;
}

// Notification schema
const notificationSchema = new Schema<INotification>(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            required: true
        },
        content: {
            type: String,
            required: true
        },
        relatedResource: {
            type: {
                type: String,
                enum: Object.values(ResourceType),
                required: true
            },
            id: {
                type: Schema.Types.ObjectId,
                required: true
            }
        },
        isRead: {
            type: Boolean,
            default: false
        },
        emailSent: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification; 