const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recipient is required'],
        },
        type: {
            type: String,
            enum: ['projectStatus', 'newComment', 'newAssignment', 'newSubmission'],
            required: [true, 'Notification type is required'],
        },
        content: {
            type: String,
            required: [true, 'Notification content is required'],
        },
        relatedResource: {
            type: {
                type: String,
                enum: ['project', 'comment', 'assignment'],
                required: [true, 'Related resource type is required'],
            },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                required: [true, 'Related resource ID is required'],
                refPath: 'relatedResource.type',
            },
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        emailSent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'relatedResource.type': 1, 'relatedResource.id': 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 