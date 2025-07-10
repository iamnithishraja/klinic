import mongoose from "mongoose";

const laboratoryServiceSchema = new mongoose.Schema({
    laboratory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: null,
    },
    rating: {
        type: Number,
        default: 0,
    },
    totalRatings: {
        type: Number,
        default: 0,
    },
    ratingBreakdown: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
    },
    ratedAppointments: [{
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LabAppointments',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        ratedAt: {
            type: Date,
            default: Date.now,
        }
    }],
    coverImage: {
        type: String,
        default: null,
    },
    collectionType: {
        type: String,
        enum: ['home', 'lab', 'both'],
        default: 'both',
    },
    price: {
        type: Number,
        default: null,
    },
    category: {
        type: String,
        default: null,
    },
    tests: [{
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: null,
        },
        price: {
            type: Number,
            default: null,
        },
    }],
    isActive: {
        type: Boolean,
        default: true,
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

// Index for efficient rating queries
laboratoryServiceSchema.index({ rating: -1 });
laboratoryServiceSchema.index({ totalRatings: -1 });
laboratoryServiceSchema.index({ 'ratedAppointments.appointmentId': 1 });

const LaboratoryService = mongoose.model('LaboratoryService', laboratoryServiceSchema);

export default LaboratoryService; 