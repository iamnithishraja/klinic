import { create } from 'zustand';
import { productService, Product, ProductSearchFilters, ProductSearchResponse } from '../services/productService';

interface ProductStore {
  // State
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: ProductSearchFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Actions
  fetchProducts: (newFilters?: Partial<ProductSearchFilters>, isRefreshing?: boolean) => Promise<void>;
  refreshProducts: () => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (newFilters: Partial<ProductSearchFilters>) => void;
  resetFilters: () => void;
}

const initialFilters: ProductSearchFilters = {
  page: 1,
  limit: 10,
};

const initialState = {
  products: [],
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
};

export const useProductStore = create<ProductStore>((set, get) => ({
  ...initialState,

  // Actions
  fetchProducts: async (newFilters?: Partial<ProductSearchFilters>, isRefreshing: boolean = false) => {
    try {
      console.log('ProductStore - fetchProducts called with:', { newFilters, isRefreshing });
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

      console.log('ProductStore - Fetching products with filters:', updatedFilters);
      const response: ProductSearchResponse = await productService.searchProducts(updatedFilters);
      console.log('ProductStore - Products response:', response);
      
      set({
        products: response.products,
        pagination: response.pagination,
      });
      
      console.log('ProductStore - State updated with products:', response.products.length);
    } catch (error) {
      console.error('ProductStore - Error in fetchProducts:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch products' });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshProducts: async () => {
    await get().fetchProducts(undefined, true);
  },

  loadMore: async () => {
    try {
      const { pagination, filters, isLoading, isLoadingMore } = get();
      
      if (!pagination.hasNextPage || isLoading || isLoadingMore) {
        return;
      }

      set({ isLoadingMore: true });

      const nextPage = pagination.currentPage + 1;
      const updatedFilters = { ...filters, page: nextPage };
      
      const response: ProductSearchResponse = await productService.searchProducts(updatedFilters);
      
      set(state => ({
        products: [...state.products, ...response.products],
        pagination: response.pagination,
        filters: updatedFilters,
      }));
    } catch (error) {
      console.error('Error in loadMore:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load more products' });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  setFilters: (newFilters: Partial<ProductSearchFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  resetFilters: () => {
    set({ filters: initialFilters });
  },
})); 