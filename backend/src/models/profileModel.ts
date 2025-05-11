import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    profilePicture: {
        type: String,
        default: null,
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
    medicalHistoryPdf: {
        type: String,
        default: null,
    },
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
        enum: [
            'Cardiologist',
            'Dermatologist',
            'Pediatrician',
            'Psychiatrist',
            'General Practitioner',
            'Orthopedic Surgeon',
            'Neurologist',
            'Endocrinologist',
            'Gastroenterologist',
            'Hematologist',
            'Immunologist',
            'Nephrologist',
            'Pulmonologist',
            'Rheumatologist',
            'Urologist',
            'Vascular Surgeon',
            'Anesthesiologist',
            'Allergist',
            'Oncologist',
            'Ophthalmologist',
            'Obstetrician',
            'Gynecologist',
            'Otolaryngologist',
            'Radiologist',
            'Emergency Physician',
            'Family Medicine',
            'Infectious Disease Specialist',
            'Internal Medicine',
            'Neonatologist',
            'Neurosurgeon',
            'Plastic Surgeon',
            'Pain Management Specialist',
            'Pathologist',
            'Physical Medicine & Rehabilitation',
            'Geriatrician',
            'Sports Medicine',
            'Thoracic Surgeon',
            'Transplant Surgeon',
            'Trauma Surgeon',
            'Critical Care Specialist',
            'Colorectal Surgeon',
            'Medical Geneticist',
            'Nuclear Medicine Specialist',
            'Preventive Medicine Specialist',
            'Occupational Medicine Specialist',
            'Other'
        ],
        default: null,
    },
    education: {
        type: String,
        default: null,
    },
    consultationFee: {
        type: Number,
        default: null,
    },
    profilePicture: {
        type: String,
        default: null,
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
    clinicImages: {
        type: [String],
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
    laboratoryAddress: {
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
    laboratoryServices: {
        type: [
            {
                name: {
                    type: String,
                    default: null,
                },
                description: {
                    type: String,
                    default: null,
                },
                images: {
                    type: [String],
                    default: null,
                },
                collectionType: {
                    type: String,
                    enum: ['home', 'lab', 'both'],
                    default: null,
                },
                tests: [
                    {
                        name: {
                            type: String,
                            default: null,
                        },
                        description: {
                            type: String,
                            default: null,
                        },
                    }
                ],
                price: {
                    type: Number,
                    default: null,
                },
            }
        ],
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
export { UserProfile, DoctorProfile, LaboratoryProfile };
