import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  userId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId; // Generic provider ID (doctor or laboratoryService)
  providerType: 'doctor' | 'laboratoryService'; // Only doctor and laboratoryService
  rating: number; // 1-5 stars
  comment?: string; // Updated from feedback to comment
  doctorProfileId?: mongoose.Types.ObjectId; // Keep for backward compatibility
  laboratoryServiceId?: mongoose.Types.ObjectId; // Keep for backward compatibility
  type?: 'doctor' | 'laboratory'; // Keep for backward compatibility
  feedback?: string; // Keep for backward compatibility
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
  appointmentId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  providerId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  providerType: {
    type: String,
    enum: ['doctor', 'laboratoryService'],
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Backward compatibility fields
  doctorProfileId: {
    type: Schema.Types.ObjectId,
    ref: 'DoctorProfile'
  },
  laboratoryServiceId: {
    type: Schema.Types.ObjectId,
    ref: 'LaboratoryService'
  },
  type: {
    type: String,
    enum: ['doctor', 'laboratory']
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
ratingSchema.index({ providerId: 1, providerType: 1 });

// Backward compatibility indexes
ratingSchema.index({ doctorProfileId: 1, type: 1 });
ratingSchema.index({ laboratoryServiceId: 1, type: 1 });

// Pre-save middleware to populate backward compatibility fields
ratingSchema.pre('save', function(next) {
  if (this.providerType === 'doctor') {
    this.doctorProfileId = this.providerId;
    this.type = 'doctor';
    this.feedback = this.comment;
  } else if (this.providerType === 'laboratoryService') {
    this.laboratoryServiceId = this.providerId;
    this.type = 'laboratory';
    this.feedback = this.comment;
  }
  next();
});

const Rating = mongoose.model<IRating>('Rating', ratingSchema);

export default Rating; 