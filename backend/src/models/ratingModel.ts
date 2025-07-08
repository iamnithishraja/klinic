import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  userId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId; // doctorId or labId
  appointmentId: mongoose.Types.ObjectId;
  type: 'doctor' | 'laboratory';
  rating: number; // 1-5 stars
  feedback?: string;
  mark: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  appointmentId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  type: {
    type: String,
    enum: ['doctor', 'laboratory'],
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 500
  },
  mark: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one rating per user per appointment
ratingSchema.index({ userId: 1, appointmentId: 1 }, { unique: true });

// Index for efficient queries by provider
ratingSchema.index({ providerId: 1, type: 1 });

const Rating = mongoose.model<IRating>('Rating', ratingSchema);

export default Rating; 