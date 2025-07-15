import mongoose, { Schema, Document } from 'mongoose';

export interface ISuspendedUser extends Document {
  email?: string;
  phone?: string;
  reason: string;
  suspendedBy: mongoose.Types.ObjectId; // Admin who suspended the user
  suspendedAt: Date;
  expiresAt?: Date; // Optional expiration date for temporary suspensions
  isActive: boolean; // Whether the suspension is currently active
  notes?: string; // Additional notes from admin
}

const suspendedUserSchema = new Schema<ISuspendedUser>({
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  suspendedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  suspendedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique email/phone combinations
suspendedUserSchema.index({ email: 1, phone: 1 }, { unique: true, sparse: true });

// Index for active suspensions
suspendedUserSchema.index({ isActive: 1, expiresAt: 1 });

// Method to check if a suspension is still valid
suspendedUserSchema.methods.isValid = function(): boolean {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

// Static method to check if email/phone is suspended
suspendedUserSchema.statics.isSuspended = async function(email?: string, phone?: string): Promise<boolean> {
  const query: any = { isActive: true };
  
  if (email) {
    query.email = email.toLowerCase();
  }
  if (phone) {
    query.phone = phone;
  }
  
  // Check for expired suspensions
  query.$or = [
    { expiresAt: { $exists: false } }, // Permanent suspensions
    { expiresAt: { $gt: new Date() } } // Non-expired temporary suspensions
  ];
  
  const suspendedUser = await this.findOne(query);
  return !!suspendedUser;
};

// Static method to get suspension details
suspendedUserSchema.statics.getSuspensionDetails = async function(email?: string, phone?: string) {
  const query: any = { isActive: true };
  
  if (email) {
    query.email = email.toLowerCase();
  }
  if (phone) {
    query.phone = phone;
  }
  
  const suspendedUser = await this.findOne(query).populate('suspendedBy', 'name email');
  return suspendedUser;
};

const SuspendedUser = mongoose.model<ISuspendedUser>('SuspendedUser', suspendedUserSchema);

export default SuspendedUser; 