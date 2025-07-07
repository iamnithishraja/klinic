import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  userId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  type: 'doctor' | 'lab';
  providerId: mongoose.Types.ObjectId;
  rating: number; // 1-5
  feedback?: string;
  createdAt: Date;
}

const ratingSchema = new Schema<IRating>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['doctor', 'lab'], required: true },
  providerId: { type: Schema.Types.ObjectId, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Rating = mongoose.model<IRating>('Rating', ratingSchema);
export default Rating; 