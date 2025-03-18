import mongoose, { Document, Schema } from 'mongoose';

// File document interface
export interface IFile extends Document {
    project: mongoose.Types.ObjectId;
    filename: string;
    path: string;
    content: string;
    fileType: string;
    createdAt: Date;
    s3Key: string;
    language: string;
}

// File schema
const fileSchema = new Schema<IFile>(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        filename: {
            type: String,
            required: true,
            trim: true
        },
        path: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            required: true
        },
        s3Key: {
            type: String,
            required: true
        },
        language: {
            type: String,
            required: true,
            default: 'plaintext'
        }
    },
    {
        timestamps: true
    }
);

const File = mongoose.model<IFile>('File', fileSchema);

export default File; 