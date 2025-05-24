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
  laboratoryServices: Array<{
    name: string;
    category: string;
    price: number;
    collectionType: 'home' | 'lab' | 'both';
    rating: number;
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