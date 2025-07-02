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

const LaboratoryService = mongoose.model('LaboratoryService', laboratoryServiceSchema);

export default LaboratoryService; 