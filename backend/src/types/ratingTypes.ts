import mongoose from 'mongoose';

// Base interfaces
export interface IRatingBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface IRatedAppointment {
  appointmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  ratedAt: Date;
}



export interface IRating {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  providerType: 'doctor' | 'laboratoryService';
  rating: number;
  comment?: string;
  mark: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILabAppointment {
  _id: mongoose.Types.ObjectId;
  lab?: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  laboratoryService: mongoose.Types.ObjectId;
  selectedTests: number[];
  timeSlot: Date;
  collectionType: 'lab' | 'home';
  status: 'pending' | 'processing' | 'completed' | 'upcoming' | 'collected' | 'marked-as-read';
  isPaid: boolean;
  reportResult?: string;
  testReportPdfs: string[];
  reportsUploaded: boolean;
  notes?: string;
  feedbackRequested: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response interfaces
export interface SubmitRatingRequest {
  appointmentId: string;
  providerId: string;
  providerType: 'doctor' | 'laboratoryService';
  rating: number;
  comment?: string;
}

export interface RatingResponse {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
}

export interface ServiceRatingResponse {
  service: {
    _id: string;
    name: string;
    rating: number;
    totalRatings: number;
    ratingBreakdown: IRatingBreakdown;
  };
  ratings: RatingResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRatings: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AppointmentNeedingRating {
  appointmentId: string;
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  serviceImage?: string;
  laboratoryName: string;
  appointmentDate: Date;
  completedAt: Date;
}

export interface TopRatedService {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  rating: number;
  totalRatings: number;
  category?: string;
  price?: number;
}

// Query interfaces
export interface RatingQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'totalRatings' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TopRatedQueryParams {
  limit?: number;
  category?: string;
  minRating?: number;
} 