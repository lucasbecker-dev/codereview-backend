import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// User roles enum
export enum UserRole {
    STUDENT = 'student',
    REVIEWER = 'reviewer',
    ADMIN = 'admin',
    SUPERADMIN = 'superadmin'
}

// User notification preferences
interface NotificationPreferences {
    email: {
        projectStatus: boolean;
        newComment: boolean;
        newAssignment: boolean;
        newSubmission: boolean;
    };
    inApp: {
        projectStatus: boolean;
        newComment: boolean;
        newAssignment: boolean;
        newSubmission: boolean;
    };
}

// User document interface
export interface IUser extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    cohort?: mongoose.Types.ObjectId;
    isActive: boolean;
    isVerified: boolean;
    verificationToken?: string;
    profilePicture?: string;
    bio?: string;
    notificationPreferences: NotificationPreferences;
    lastLogin?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.STUDENT,
            required: true,
        },
        cohort: {
            type: Schema.Types.ObjectId,
            ref: 'Cohort',
            required: function () {
                return this.role === UserRole.STUDENT;
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: String,
        profilePicture: String,
        bio: String,
        notificationPreferences: {
            email: {
                projectStatus: { type: Boolean, default: true },
                newComment: { type: Boolean, default: true },
                newAssignment: { type: Boolean, default: true },
                newSubmission: { type: Boolean, default: true },
            },
            inApp: {
                projectStatus: { type: Boolean, default: true },
                newComment: { type: Boolean, default: true },
                newAssignment: { type: Boolean, default: true },
                newSubmission: { type: Boolean, default: true },
            },
        },
        lastLogin: Date,
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);

export default User; 