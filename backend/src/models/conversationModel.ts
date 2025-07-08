import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    }
});

const conversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        default: 'Toctor AI Consultation',
    },
    messages: [messageSchema],
    contextSnapshot: {
        // Store relevant medical context at conversation start
        medicalHistory: String,
        recentAppointments: [mongoose.Schema.Types.Mixed],
        recentPrescriptions: [mongoose.Schema.Types.Mixed],
        recentLabResults: [mongoose.Schema.Types.Mixed],
        userProfile: mongoose.Schema.Types.Mixed,
        lastUpdated: {
            type: Date,
            default: Date.now,
        }
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
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

// Create indexes for efficient queries
conversationSchema.index({ user: 1, lastMessageAt: -1 });
conversationSchema.index({ user: 1, isActive: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation; 