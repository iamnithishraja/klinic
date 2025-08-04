import mongoose from "mongoose";

const accountDeletionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['pending', 'deleted'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
});

// Update the updatedAt field on save
accountDeletionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const AccountDeletion = mongoose.model('AccountDeletion', accountDeletionSchema);

export default AccountDeletion; 