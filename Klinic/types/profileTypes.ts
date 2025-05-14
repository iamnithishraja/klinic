import { UserRole } from './userTypes';

export interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isPhoneEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface Address {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  pinCode?: string | null;
}

export interface UserProfile {
  _id?: string;
  user?: string;
  profilePicture?: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  medicalHistory?: string;
  medicalHistoryPdf?: string;
  address?: Address;
  city?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface DoctorProfile {
  _id?: string;
  user?: string;
  description?: string;
  experience?: number;
  specializations?: string[];
  qualifications?: string[];
  consultationFee?: number;
  profilePicture?: string;
  age?: number;
  gender?: string;
  consultationType?: 'online' | 'in-person' | 'both';
  availableSlots?: string[];
  availableDays?: string[];
  isAvailable?: boolean;
  clinicName?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicWebsite?: string;
  clinicImages?: string[];
  clinicAddress?: Address;
  city?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface LaboratoryProfile {
  _id?: string;
  user?: string;
  laboratoryName?: string;
  laboratoryAddress?: Address;
  laboratoryPhone?: string;
  laboratoryEmail?: string;
  laboratoryWebsite?: string;
  laboratoryServices?: any[];
  isVerified?: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface DeliveryBoyProfile {
  _id?: string;
  user?: string;
  profilePicture?: string;
  age?: number;
  gender?: string;
  delivarablePinCodes?: string[];
  isVerified?: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}

export type ProfileUpdateData = UserProfile | DoctorProfile | LaboratoryProfile | DeliveryBoyProfile; 