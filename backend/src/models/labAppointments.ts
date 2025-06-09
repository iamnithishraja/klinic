import mongoose from "mongoose";

const labAppointmentsSchema = new mongoose.Schema({
    lab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    timeSlot: {
        type: String,
        required: true,
    },
    collectionType: {
        type: String,
        enum: ['lab', 'home'],
        default: null,
    },
    status: {
        type: String,
        enum: ['upcoming', 'collected', 'completed'],
        default: 'upcoming',
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    serviceIndex: {
        type: Number,
        default: 0,
    },
    reportResult: {
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

const LabAppointments = mongoose.model('LabAppointments', labAppointmentsSchema);

export default LabAppointments;