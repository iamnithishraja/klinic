import { create } from 'zustand';
import { laboratoryService, Laboratory, PaginationData, LaboratorySearchFilters, LaboratorySearchResponse } from '../services/laboratoryService';

interface LaboratoryStore {
  // State
  laboratories: Laboratory[];
  pagination: PaginationData;
  filters: LaboratorySearchFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  availableFilters: {
    categories: string[];
    cities: string[];
    collectionTypes: string[];
  };

  // Actions
  searchLaboratories: (newFilters?: Partial<LaboratorySearchFilters>, isRefreshing?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (newFilters: Partial<LaboratorySearchFilters>) => void;
  resetFilters: () => void;
}

const initialFilters: LaboratorySearchFilters = {
  page: 1,
  limit: 2,
};

const initialState = {
  laboratories: [],
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
    categories: [],
    cities: [],
    collectionTypes: [],
  },
};

export const useLaboratoryStore = create<LaboratoryStore>((set, get) => ({
  ...initialState,

  // Actions
  searchLaboratories: async (newFilters?: Partial<LaboratorySearchFilters>, isRefreshing: boolean = false) => {
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

      const response = await laboratoryService.searchLaboratories(updatedFilters);
      
      set({
        laboratories: response.laboratories,
        pagination: response.pagination,
        availableFilters: {
          categories: response.filters.availableCategories,
          cities: response.filters.availableCities,
          collectionTypes: response.filters.collectionTypes,
        },
      });
    } catch (error) {
      set({ error: 'Failed to fetch laboratories' });
      console.error('Error in searchLaboratories:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { filters, pagination, laboratories, isLoading, isLoadingMore } = get();
    
    if (isLoading || isLoadingMore || !pagination.hasNextPage) return;

    try {
      set({ isLoadingMore: true, error: null });
      
      const nextPage = pagination.currentPage + 1;
      const response = await laboratoryService.searchLaboratories({
        ...filters,
        page: nextPage,
      });
      
      // Create a Set of existing laboratory IDs for deduplication
      const existingIds = new Set(laboratories.map(lab => lab._id));
      // Filter out any duplicate laboratories from the new response
      const newLaboratories = response.laboratories.filter((lab: Laboratory) => !existingIds.has(lab._id));
      
      set({
        laboratories: [...laboratories, ...newLaboratories],
        pagination: response.pagination,
        filters: { ...filters, page: nextPage },
      });
    } catch (error) {
      set({ error: 'Failed to load more laboratories' });
      console.error('Error in loadMore:', error);
    } finally {
      set({ isLoadingMore: false });
    }
  },

  setFilters: (newFilters: Partial<LaboratorySearchFilters>) => {
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