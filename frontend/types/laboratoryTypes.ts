import { Address } from './profileTypes';

export interface LaboratoryTest {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface LaboratoryService {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  collectionType: 'home' | 'lab' | 'both';
  tests: LaboratoryTest[];
  price: string;
  category?: string;
}

export interface LaboratoryProfile {
  _id?: string;
  user?: string;
  laboratoryName?: string;
  laboratoryAddress?: Address;
  laboratoryPhone?: string;
  laboratoryEmail?: string;
  laboratoryWebsite?: string;
  laboratoryServices?: LaboratoryService[];
  isVerified?: boolean;
  city?: string;
  updatedAt?: Date;
  createdAt?: Date;
} 