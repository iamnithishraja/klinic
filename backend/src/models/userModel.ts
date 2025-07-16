import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    profilePicture: {
        type: String,
        default: null,
    },
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
    },

    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false,
    },
    isPhoneEmailVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'user', 'doctor', 'laboratory', 'deliverypartner'],
    },
    phoneOtp: {
        type: String,
        default: null,
        select: false,
    },
    emailOtp: {
        type: String,
        default: null,
        select: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', userSchema);

export default User;

