// Profile field types for admin web

export interface UserProfileFields {
  gender: string | null;
  age: number | null;
  address: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    pinCode: string | null;
    googleMapsLink: string | null;
  };
  city: string | null;
  profilePicture: string | null;
  medicalHistory: string | null;
  medicalHistoryPdfs: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DoctorProfileFields extends UserProfileFields {
  coverImage: string | null;
  description: string | null;
  experience: number | null;
  specializations: string[];
  qualifications: string[];
  consultationFee: number | null;
  registrationNumber: string | null;
  isVerified: boolean;
  consultationType: string | null;
  availableSlots: string[];
  availableDays: string[];
  isAvailable: boolean;
  rating: number | null;
}

export interface LaboratoryProfileFields {
  laboratoryName: string | null;
  laboratoryPhone: string | null;
  laboratoryEmail: string | null;
  laboratoryWebsite: string | null;
  laboratoryAddress: {
    address: string | null;
    pinCode: string | null;
    googleMapsLink: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  coverImage: string | null;
  city: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  availableDays: string[];
  availableSlots: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DeliveryPartnerProfileFields {
  gender: string | null;
  age: number | null;
  address: {
    address: string | null;
    pinCode: string | null;
  };
  city: string | null;
  profilePicture: string | null;
  isVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
} 