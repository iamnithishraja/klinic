import { create } from 'zustand';
import { productService, Product, ProductSearchFilters, ProductSearchResponse } from '../services/productService';
import { CartItem } from '../services/orderService';

interface ProductStore {
  // State
  products: Product[];
  cart: CartItem[];
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
  
  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  getCartItem: (productId: string) => CartItem | undefined;
}

const initialFilters: ProductSearchFilters = {
  page: 1,
  limit: 10,
};

const initialState = {
  products: [],
  cart: [],
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
          cart: get().cart, // Preserve cart
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

  // Cart actions
  addToCart: (product: Product, quantity: number = 1) => {
    console.log('ProductStore - Adding to cart:', {
      productName: product.name,
      productId: product._id,
      quantity,
      currentCartSize: get().cart.length
    });
    
    set(state => {
      const existingItem = state.cart.find(item => item.product._id === product._id);
      
      if (existingItem) {
        // Update existing item quantity
        const updatedCart = state.cart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        console.log('ProductStore - Updated existing item in cart. New quantity:', existingItem.quantity + quantity);
        return { cart: updatedCart };
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          product,
          quantity,
        };
        console.log('ProductStore - Added new item to cart. Total items:', state.cart.length + 1);
        return { cart: [...state.cart, newItem] };
      }
    });
    
    // Log final cart state
    setTimeout(() => {
      const finalCart = get().cart;
      console.log('ProductStore - Final cart state:', {
        totalItems: finalCart.length,
        totalQuantity: finalCart.reduce((sum, item) => sum + item.quantity, 0),
        items: finalCart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        }))
      });
    }, 0);
  },

  removeFromCart: (productId: string) => {
    set(state => ({
      cart: state.cart.filter(item => item.product._id !== productId)
    }));
  },

  updateCartQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }

    set(state => ({
      cart: state.cart.map(item =>
        item.product._id === productId
          ? { ...item, quantity }
          : item
      )
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  },

  getCartItemCount: () => {
    const { cart } = get();
    return cart.reduce((count, item) => count + item.quantity, 0);
  },

  getCartItem: (productId: string) => {
    const { cart } = get();
    return cart.find(item => item.product._id === productId);
  },
})); 