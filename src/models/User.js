const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User schema will be fully implemented in Phase 1: Step 4
const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
        },
        role: {
            type: String,
            enum: ['student', 'reviewer', 'admin', 'superadmin'],
            default: 'student',
        },
        cohort: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cohort',
            // Only required for students
            validate: {
                validator: function () {
                    return this.role !== 'student' || this.cohort;
                },
                message: 'Cohort is required for students'
            }
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpire: {
            type: Date,
        },
        profilePicture: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            default: '',
        },
        notificationPreferences: {
            email: {
                projectStatus: {
                    type: Boolean,
                    default: true,
                },
                newComment: {
                    type: Boolean,
                    default: true,
                },
                newAssignment: {
                    type: Boolean,
                    default: true,
                },
                newSubmission: {
                    type: Boolean,
                    default: true,
                },
            },
            inApp: {
                projectStatus: {
                    type: Boolean,
                    default: true,
                },
                newComment: {
                    type: Boolean,
                    default: true,
                },
                newAssignment: {
                    type: Boolean,
                    default: true,
                },
                newSubmission: {
                    type: Boolean,
                    default: true,
                },
            },
        },
        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 