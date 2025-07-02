import mongoose from "mongoose";

const clinicSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    clinicName: {
        type: String,
        default: null,
    },
    clinicPhone: {
        type: String,
        default: null,
    },
    clinicEmail: {
        type: String,
        default: null,
    },
    clinicWebsite: {
        type: String,
        default: null,
    },
    clinicAddress: {
        latitude: {
            type: Number,
            default: null,
        },
        longitude: {
            type: Number,
            default: null,
        },
        address: {
            type: String,
            default: null,
        },
        pinCode: {
            type: String,
            default: null,
        },
        googleMapsLink: {
            type: String,
            default: null,
        },
    },
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

const Clinic = mongoose.model('Clinic', clinicSchema);

export default Clinic; 