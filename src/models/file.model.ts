import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    project: mongoose.Types.ObjectId;
    filename: string;
    path: string;
    content: string;
    fileType: string;
    createdAt: Date;
    s3Key: string;
    s3Url: string;
    language: string;
    size: number;
    mimeType: string;
    uploadedBy: mongoose.Types.ObjectId;
}

const FileSchema: Schema = new Schema(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        filename: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            default: '',
        },
        fileType: {
            type: String,
            required: true,
        },
        s3Key: {
            type: String,
            required: true,
            unique: true,
        },
        s3Url: {
            type: String,
        },
        language: {
            type: String,
            default: 'plaintext',
        },
        size: {
            type: Number,
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to generate language from fileType
FileSchema.pre<IFile>('save', function (next) {
    // Map file extensions to programming languages for syntax highlighting
    const extensionToLanguage: Record<string, string> = {
        '.js': 'javascript',
        '.jsx': 'jsx',
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.py': 'python',
        '.rb': 'ruby',
        '.java': 'java',
        '.c': 'c',
        '.cpp': 'cpp',
        '.cs': 'csharp',
        '.php': 'php',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.json': 'json',
        '.md': 'markdown',
        '.xml': 'xml',
        '.sql': 'sql',
        '.go': 'go',
        '.rs': 'rust',
        '.sh': 'bash',
        '.yaml': 'yaml',
        '.yml': 'yaml',
    };

    // Extract extension from filename
    const fileExt = this.filename.substring(this.filename.lastIndexOf('.')).toLowerCase();

    // Set language based on extension, or default to plaintext
    this.language = extensionToLanguage[fileExt] || 'plaintext';

    next();
});

// Virtual for direct download URL (not stored in DB)
FileSchema.virtual('downloadUrl').get(function (this: IFile) {
    return `/api/files/download/${this.s3Key}`;
});

// Virtual for view URL (not stored in DB)
FileSchema.virtual('viewUrl').get(function (this: IFile) {
    return `/api/files/${this.s3Key}`;
});

export default mongoose.model<IFile>('File', FileSchema); 