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
    time: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
    },
    collectionType: {
        type: String,
        enum: ['in-person', 'online', 'both'],
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