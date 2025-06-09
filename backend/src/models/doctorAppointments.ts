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
    timeSlot: {
        type: String,
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
    clinicIndex: {
        type: Number,
        default: 0,
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