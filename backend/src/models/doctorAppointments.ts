import mongoose from "mongoose";

const doctorAppointmentsSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        default: null,
    },
    timeSlot: {
        type: Date,
        required: true,
    },
    consultationType: {
        type: String,
        enum: ['in-person', 'online', 'both'],
        default: null,
    },
    consultationFee: {
        type: Number,
        default: null,
    },
    prescription: {
        type: String,
        default: null,
    },
    prescriptionSent: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['upcoming', 'completed'],
        default: 'upcoming',
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    notes: {
        type: String,
        default: null,
    },
    videoCallStarted: {
        type: Boolean,
        default: false,
    },
    videoCallStartTime: {
        type: Date,
        default: null,
    },
    videoCallEnded: {
        type: Boolean,
        default: false,
    },
    videoCallEndTime: {
        type: Date,
        default: null,
    },
    feedbackRequested: {
        type: Boolean,
        default: false,
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

const DoctorAppointments = mongoose.model('DoctorAppointments', doctorAppointmentsSchema);

export default DoctorAppointments;