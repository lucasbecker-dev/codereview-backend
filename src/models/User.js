const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ["student", "reviewer", "admin", "superadmin"],
        default: "student"
    },
    cohort: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cohort'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    profilePicture: String,
    bio: String,
    notificationPreferences: {
        email: {
            projectStatus: { type: Boolean, default: true },
            newComment: { type: Boolean, default: true },
            newAssignment: { type: Boolean, default: true },
            newSubmission: { type: Boolean, default: true }
        },
        inApp: {
            projectStatus: { type: Boolean, default: true },
            newComment: { type: Boolean, default: true },
            newAssignment: { type: Boolean, default: true },
            newSubmission: { type: Boolean, default: true }
        }
    },
    lastLogin: Date
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Pre-save hook to hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash the password if it's modified or new
    if (!this.isModified('password')) return next();

    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to return user data without sensitive information
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.verificationToken;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 