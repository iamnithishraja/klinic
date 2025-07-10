// Base interfaces
export interface RatingBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface User {
  _id: string;
  name: string;
  profilePicture?: string;
}

export interface Rating {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  userId: User;
}

export interface ServiceRating {
  _id: string;
  name: string;
  rating: number;
  totalRatings: number;
  ratingBreakdown: RatingBreakdown;
}

export interface ServiceRatingResponse {
  service: ServiceRating;
  ratings: Rating[];
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

// Request interfaces
export interface SubmitRatingRequest {
  appointmentId: string;
  serviceId: string;
  rating: number;
  comment?: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface SubmitRatingResponse {
  rating: {
    _id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  };
}

export interface CheckRatingResponse {
  hasRated: boolean;
  rating: {
    _id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  } | null;
}

export interface AppointmentsNeedingRatingResponse {
  appointmentsNeedingRating: AppointmentNeedingRating[];
  totalCount: number;
}

export interface TopRatedServicesResponse {
  services: TopRatedService[];
  totalCount: number;
}

// Hook interfaces
export interface RatingModalData {
  appointmentId: string;
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  serviceImage?: string;
  laboratoryName: string;
  appointmentDate: Date;
}

export interface LabAppointment {
  _id: string;
  status: string;
  laboratoryService: {
    _id: string;
    name: string;
    description?: string;
    coverImage?: string;
  };
  lab?: {
    _id: string;
    laboratoryName?: string;
  };
  timeSlot: Date;
  updatedAt: Date;
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