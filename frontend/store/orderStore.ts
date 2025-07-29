import { create } from 'zustand';
import { orderService, Order, OrderFilters, OrderResponse } from '../services/orderService';

interface OrderStore {
  // State
  orders: Order[];
  labOrders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: OrderFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Actions
  fetchOrders: (newFilters?: Partial<OrderFilters>, isRefreshing?: boolean) => Promise<void>;
  fetchLabOrders: (newFilters?: Partial<OrderFilters>, isRefreshing?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (newFilters: Partial<OrderFilters>) => void;
  resetFilters: () => void;
  createOrder: (orderData: any) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled') => Promise<boolean>;
  claimOrder: (orderId: string) => Promise<boolean>;
}

const initialFilters: OrderFilters = {
  page: 1,
  limit: 10,
};

const initialState = {
  orders: [],
  labOrders: [],
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

export const useOrderStore = create<OrderStore>((set, get) => ({
  ...initialState,

  // Actions
  fetchOrders: async (newFilters?: Partial<OrderFilters>, isRefreshing: boolean = false) => {
    try {
      console.log('Fetching orders with filters:', newFilters, 'isRefreshing:', isRefreshing);
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

      console.log('Final filters for orders:', updatedFilters);
      const response: OrderResponse = await orderService.getMyOrders(updatedFilters);
      console.log('Orders response received:', response);
      
      set({
        orders: response.orders,
        pagination: response.pagination,
      });
      
      console.log('Orders state updated:', response.orders.length, 'orders');
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch orders' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLabOrders: async (newFilters?: Partial<OrderFilters>, isRefreshing: boolean = false) => {
    try {
      console.log('Fetching lab orders with filters:', newFilters, 'isRefreshing:', isRefreshing);
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

      console.log('Final filters for lab orders:', updatedFilters);
      const response: OrderResponse = await orderService.getLabOrders(updatedFilters);
      console.log('Lab orders response received:', response);
      
      set({
        labOrders: response.orders,
        pagination: response.pagination,
      });
      
      console.log('Lab orders state updated:', response.orders.length, 'orders');
    } catch (error) {
      console.error('Error in fetchLabOrders:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch lab orders' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    try {
      const { pagination, filters, isLoading, isLoadingMore } = get();
    
      if (!pagination.hasNextPage || isLoading || isLoadingMore) {
        console.log('Cannot load more - conditions not met:', {
          hasNextPage: pagination.hasNextPage,
          isLoading,
          isLoadingMore
        });
        return;
      }

      console.log('Loading more orders...');
      set({ isLoadingMore: true });
      
      const nextPage = pagination.currentPage + 1;
      const updatedFilters = { ...filters, page: nextPage };
      
      const response: OrderResponse = await orderService.getMyOrders(updatedFilters);
      
      set(state => ({
        orders: [...state.orders, ...response.orders],
        pagination: response.pagination,
        filters: updatedFilters,
      }));
      
      console.log('More orders loaded:', response.orders.length, 'new orders');
    } catch (error) {
      console.error('Error in loadMore:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load more orders' });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  setFilters: (newFilters: Partial<OrderFilters>) => {
    console.log('Setting new filters:', newFilters);
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  resetFilters: () => {
    console.log('Resetting filters to initial state');
    set({ filters: initialFilters });
  },

  createOrder: async (orderData: any): Promise<Order | null> => {
    try {
      console.log('Creating order with data:', orderData);
      set({ error: null });
      const order = await orderService.createOrder(orderData);
      
      console.log('Order created successfully:', order);
      
      // Refresh orders list after creating new order
      await get().fetchOrders(undefined, true);
      
      return order;
    } catch (error) {
      console.error('Error in createOrder:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create order' });
      return null;
    }
  },

  claimOrder: async (orderId: string): Promise<boolean> => {
    try {
      console.log('Claiming order:', orderId);
      set({ error: null });
      await orderService.claimOrder(orderId);
      
      console.log('Order claimed successfully');
      
      // Refresh the lab orders list after claiming
      await get().fetchLabOrders(undefined, true);
      
      return true;
    } catch (error) {
      console.error('Error in claimOrder:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to claim order' });
      return false;
    }
  },

  updateOrderStatus: async (orderId: string, status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled'): Promise<boolean> => {
    try {
      console.log('Updating order status:', orderId, 'to:', status);
      set({ error: null });
      await orderService.updateOrderStatus(orderId, { status });
      
      console.log('Order status updated successfully');
      
      // Update the order in the local state
      set(state => ({
        orders: state.orders.map(order =>
          order._id === orderId
            ? { ...order, status }
            : order
        ),
        labOrders: state.labOrders.map(order =>
          order._id === orderId
            ? { ...order, status }
            : order
        )
      }));
      
      return true;
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update order status' });
      return false;
    }
  },
})); 