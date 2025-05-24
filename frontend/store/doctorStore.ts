import { create } from 'zustand';
import { doctorService, Doctor, PaginationData, DoctorSearchFilters, DoctorSearchResponse } from '../services/doctorService';

interface DoctorStore {
  // State
  doctors: Doctor[];
  pagination: PaginationData;
  filters: DoctorSearchFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  availableFilters: {
    specializations: string[];
    cities: string[];
    genderOptions: string[];
    consultationTypes: string[];
  };

  // Actions
  searchDoctors: (newFilters?: Partial<DoctorSearchFilters>, isRefreshing?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (newFilters: Partial<DoctorSearchFilters>) => void;
  resetFilters: () => void;
}

const initialFilters: DoctorSearchFilters = {
  page: 1,
  limit: 2,
};

const initialState = {
  doctors: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: initialFilters,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  availableFilters: {
    specializations: [],
    cities: [],
    genderOptions: [],
    consultationTypes: [],
  },
};

export const useDoctorStore = create<DoctorStore>((set, get) => ({
  ...initialState,

  // Actions
  searchDoctors: async (newFilters?: Partial<DoctorSearchFilters>, isRefreshing: boolean = false) => {
    try {
      set({ isLoading: true, error: null });
      
      // If refreshing, reset to initial state except for filters
      if (isRefreshing) {
        set({
          ...initialState,
          filters: get().filters,
          isLoading: true,
        });
      }

      // Merge new filters with existing ones
      const currentFilters = get().filters;
      const updatedFilters = {
        ...currentFilters,
        ...newFilters,
        page: isRefreshing ? 1 : (newFilters?.page || currentFilters.page),
      };
      
      set({ filters: updatedFilters });

      const response = await doctorService.searchDoctors(updatedFilters);
      
      set({
        doctors: response.doctors,
        pagination: response.pagination,
        availableFilters: {
          specializations: response.filters.availableSpecializations,
          cities: response.filters.availableCities,
          genderOptions: response.filters.genderOptions,
          consultationTypes: response.filters.consultationTypes,
        },
      });
    } catch (error) {
      set({ error: 'Failed to fetch doctors' });
      console.error('Error in searchDoctors:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { filters, pagination, doctors, isLoading, isLoadingMore } = get();
    
    if (isLoading || isLoadingMore || !pagination.hasNextPage) return;

    try {
      set({ isLoadingMore: true, error: null });
      
      const nextPage = pagination.currentPage + 1;
      const response = await doctorService.searchDoctors({
        ...filters,
        page: nextPage,
      });
      
      // Create a Set of existing doctor IDs for deduplication
      const existingIds = new Set(doctors.map(doc => doc._id));
      // Filter out any duplicate doctors from the new response
      const newDoctors = response.doctors.filter(doc => !existingIds.has(doc._id));
      
      set({
        doctors: [...doctors, ...newDoctors],
        pagination: response.pagination,
        filters: { ...filters, page: nextPage },
      });
    } catch (error) {
      set({ error: 'Failed to load more doctors' });
      console.error('Error in loadMore:', error);
    } finally {
      set({ isLoadingMore: false });
    }
  },

  setFilters: (newFilters: Partial<DoctorSearchFilters>) => {
    const currentFilters = get().filters;
    set({
      filters: {
        ...currentFilters,
        ...newFilters,
        // Reset to page 1 when filters change
        page: newFilters.page || 1,
      },
    });
  },

  resetFilters: () => {
    set({ filters: initialFilters });
  },
})); 