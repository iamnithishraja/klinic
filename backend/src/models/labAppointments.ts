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
        type: Date,
        required: true,
    },
    collectionType: {
        type: String,
        enum: ['lab', 'home'],
        default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'upcoming', 'collected', 'marked-as-read'],
        default: 'pending',
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    reportResult: {
        type: String,
        default: null,
    },
    testReportPdfs: [{
        type: String,
        default: [],
    }],
    reportsUploaded: {
        type: Boolean,
        default: false,
    },
    notes: {
        type: String,
        default: null,
    },
    feedbackRequested: {
        type: Boolean,
        default: false,
    },
    serviceFee: {
        type: Number,
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