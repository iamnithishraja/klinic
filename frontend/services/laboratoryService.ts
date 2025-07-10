import apiClient from '../api/client';

export interface Laboratory {
  _id: string;
  user: {
    name: string;
    email: string;
    phone: string;
    profilePicture?: string;
  };
  laboratoryName: string;
  laboratoryAddress: {
    pinCode: string;
    city: string;
    state: string;
    country: string;
    address: string;
  };
  laboratoryServices?: Array<{
    _id?: string; // Add service ID field
    name: string;
    category: string;
    price: number;
    collectionType: 'home' | 'lab' | 'both';
    rating: number;
    description: string;
    coverImage?: string;
    tests?: Array<{
      name: string;
      description: string;
      price: number;
    }>;
  }>;
  rating: number;
  isAvailable: boolean;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface LaboratorySearchFilters {
  city?: string;
  pinCode?: string;
  category?: string;
  collectionType?: 'home' | 'lab' | 'both';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LaboratorySearchResponse {
  laboratories: Laboratory[];
  pagination: PaginationData;
  filters: {
    availableCategories: string[];
    availableCities: string[];
    collectionTypes: string[];
  };
}

export const laboratoryService = {
  // Get ratings for a specific laboratory service
  getServiceRatings: async (serviceId: string, page = 1, limit = 10) => {
    try {
      const response = await apiClient.get(`/api/v1/ratings/providers/${serviceId}?type=laboratoryService`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching laboratory service ratings:', error);
      return {
        averageRating: 0,
          totalRatings: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
  },

  // Submit a rating for a laboratory service
  submitServiceRating: async (ratingData: {
    appointmentId: string;
    serviceId: string;
    rating: number;
    comment?: string;
  }) => {
    try {
      const unifiedRatingData = {
        appointmentId: ratingData.appointmentId,
        providerId: ratingData.serviceId,
        providerType: 'laboratoryService',
        rating: ratingData.rating,
        comment: ratingData.comment
      };
      const response = await apiClient.post('/api/v1/ratings', unifiedRatingData);
      return response.data;
    } catch (error: any) {
      console.error('Error submitting laboratory service rating:', error);
      throw error;
    }
  },

  // Get appointments needing rating
  getAppointmentsNeedingRating: async () => {
    try {
      const response = await apiClient.get('/api/v1/ratings/appointments/needing-rating');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching appointments needing rating:', error);
      return { data: { appointmentsNeedingRating: [] } };
    }
  },



  searchLaboratories: async (filters: LaboratorySearchFilters): Promise<LaboratorySearchResponse> => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const queryString = queryParams.toString();
      console.log('API Request URL:', `/api/v1/laboratories?${queryString}`);
      console.log('Filters being sent:', filters);
      
      const response = await apiClient.get(`/api/v1/laboratories?${queryString}`);
      
      console.log('API Response:', response.data);
      
      if (!response.data.laboratories || response.data.laboratories.length === 0) {
        console.warn('No laboratories found in the response. Using fallback data.');
        
        if (response.data.filters) {
          return response.data;
        }
        
        return {
          laboratories: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          filters: {
            availableCategories: [],
            availableCities: [],
            collectionTypes: []
          }
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error searching laboratories:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      return {
        laboratories: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        filters: {
          availableCategories: [],
          availableCities: [],
          collectionTypes: []
        }
      };
    }
  }
}; 