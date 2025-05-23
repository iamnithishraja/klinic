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
    clinics: [
        {
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
            }
        }
    ],
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
    laboratoryServices: [{
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
        }],
    }],
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
