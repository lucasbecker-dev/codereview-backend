import mongoose, { Document, Schema } from 'mongoose';

// Reply interface
interface Reply {
    author: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
}

// Comment document interface
export interface IComment extends Document {
    project: mongoose.Types.ObjectId;
    file: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    lineNumber: number;
    text: string;
    createdAt: Date;
    replies: Reply[];
}

// Comment schema
const commentSchema = new Schema<IComment>(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        file: {
            type: Schema.Types.ObjectId,
            ref: 'File',
            required: true
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lineNumber: {
            type: Number,
            required: true
        },
        text: {
            type: String,
            required: true
        },
        replies: [
            {
                author: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                text: {
                    type: String,
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment; 