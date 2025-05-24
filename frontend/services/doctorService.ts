import apiClient from '../api/client';

export interface Doctor {
  _id: string;
  user: {
    name: string;
    email: string;
    phone: string;
    profilePicture?: string;
  };
  specializations: string[];
  consultationType: 'in-person' | 'online' | 'both';
  consultationFee: number;
  rating: number;
  clinics: Array<{
    clinicName: string;
    clinicAddress: {
      pinCode: string;
    };
  }>;
  [key: string]: any;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DoctorSearchFilters {
  city?: string;
  pinCode?: string;
  specialization?: string;
  gender?: 'male' | 'female';
  consultationType?: 'in-person' | 'online' | 'both';
  minFee?: number;
  maxFee?: number;
  minRating?: number;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DoctorSearchResponse {
  doctors: Doctor[];
  pagination: PaginationData;
  filters: {
    availableSpecializations: string[];
    availableCities: string[];
    genderOptions: string[];
    consultationTypes: string[];
  };
}

export const doctorService = {
  searchDoctors: async (filters: DoctorSearchFilters): Promise<DoctorSearchResponse> => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const queryString = queryParams.toString();
      console.log('API Request URL:', `/api/v1/doctors?${queryString}`);
      console.log('Filters being sent:', filters);
      
      // Make sure we're using the correct endpoint
      const response = await apiClient.get(`/api/v1/doctors?${queryString}`);
      
      console.log('API Response:', response.data);
      
      // If doctors array is empty but we have filters data, create a fallback response
      if (!response.data.doctors || response.data.doctors.length === 0) {
        console.warn('No doctors found in the response. Using fallback data.');
        
        // Check if we at least have the filters data structure
        if (response.data.filters) {
          // Return the response as is - it has the correct structure but empty doctors
          return response.data;
        }
        
        // If the response structure is completely different than expected
        // This is a temporary fallback to prevent UI errors
        return {
          doctors: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          filters: {
            availableSpecializations: [],
            availableCities: [],
            genderOptions: [],
            consultationTypes: []
          }
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error searching doctors:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Return a fallback response structure to prevent UI errors
      return {
        doctors: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        filters: {
          availableSpecializations: [],
          availableCities: [],
          genderOptions: [],
          consultationTypes: []
        }
      };
    }
  }
}; 