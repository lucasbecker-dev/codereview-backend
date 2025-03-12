const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project is required'],
        },
        filename: {
            type: String,
            required: [true, 'Filename is required'],
            trim: true,
        },
        path: {
            type: String,
            required: [true, 'File path is required'],
            trim: true,
        },
        content: {
            type: String,
            default: '',
        },
        fileType: {
            type: String,
            required: [true, 'File type is required'],
        },
        s3Key: {
            type: String,
        },
        language: {
            type: String,
            default: 'plaintext',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
fileSchema.index({ project: 1 });
fileSchema.index({ filename: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = File; 