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
    laboratoryService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LaboratoryService',
        required: true,
    },
    selectedTests: [{
        type: Number,
        default: [],
    }],
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
    paymentId: {
        type: String,
        default: null,
    },
    paymentOrderId: {
        type: String,
        default: null,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'captured', 'failed'],
        default: 'pending',
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