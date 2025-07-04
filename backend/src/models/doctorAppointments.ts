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
    prescription: {
        type: String,
        default: null,
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
    notes: {
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

const DoctorAppointments = mongoose.model('DoctorAppointments', doctorAppointmentsSchema);

export default DoctorAppointments;