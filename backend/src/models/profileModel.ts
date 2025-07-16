import mongoose from "mongoose";
import DoctorAppointments from "../models/doctorAppointments";

const userProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    age: {
        type: Number,
        default: null,
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: null,
    },
    medicalHistory: {
        type: String,
        default: null,
    },
    medicalHistoryPdfs: [String],
    address: {
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
        }
    },
    city: {
        type: String,
        default: null,
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

const doctorProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    coverImage: {
        type: String,
        default: null,
    },
    description: {
        type: String,
        default: null,
    },
    experience: {
        type: Number,
        default: null,
    },
    specializations: {
        type: [String],
        default: null,
    },
    qualifications: {
        type: [String],
        default: null,
    },
    consultationFee: {
        type: Number,
        default: null,
    },
    age: {
        type: Number,
        default: null,
    },
    registrationNumber: {
        type: String,
        default: null,
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: null,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['verified', 'not_verified', 'rejected'],
        default: 'not_verified',
    },
    consultationType: {
        type: String,
        enum: ['in-person', 'online', 'both'],
        default: null,
    },
    availableSlots: {
        type: [String],
        default: null,
    },
    availableDays: {
        type: [String],
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        default: null,
    },
    isAvailable: {
        type: Boolean,
        default: false,
    },
    rating: {
        type: Number,
        default: 0,
    },
    // Clinics are now stored in separate Clinic collection
    city: {
        type: String,
        default: null,
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

const laboratoryProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    laboratoryName: {
        type: String,
        default: null,
    },
    laboratoryPhone: {
        type: String,
        default: null,
    },
    laboratoryEmail: {
        type: String,
        default: null,
    },
    laboratoryWebsite: {
        type: String,
        default: null,
    },
    laboratoryAddress: {
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
        latitude: {
            type: Number,
            default: null,
        },
        longitude: {
            type: Number,
            default: null,
        },
    },
    // Laboratory services are now stored in separate LaboratoryService collection
    coverImage: {
        type: String,
        default: null,
    },
    city: {
        type: String,
        default: null,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isAvailable: {
        type: Boolean,
        default: false,
    },
    rating: {
        type: Number,
        default: 0,
    }, // added now 
    availableDays: {
        type: [String],
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        default: null,
    },
    availableSlots: {
        type: [String],
        default: null,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const deliveryBoyProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    age: {
        type: Number,
        default: null,
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: null,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    address: {
        address: {
            type: String,
            default: null,
        },
        pinCode: {
            type: String,
            default: null,
        }
    },
    city: {
        type: String,
        default: null,
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

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);
const LaboratoryProfile = mongoose.model('LaboratoryProfile', laboratoryProfileSchema);
const DeliveryBoyProfile = mongoose.model('DeliveryBoyProfile', deliveryBoyProfileSchema);
export { UserProfile, DoctorProfile, LaboratoryProfile, DeliveryBoyProfile };
