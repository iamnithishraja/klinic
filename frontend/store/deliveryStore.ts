import { create } from 'zustand';
import apiClient from '../api/client';

export interface DeliveryOrder {
  _id: string;
  orderedBy: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  laboratoryUser?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  deliveryPartner?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  products?: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      imageUrl?: string;
    };
    quantity: number;
  }>;
  prescription?: string;
  customerAddress?: string;
  customerPinCode?: string;
  totalPrice: number;
  isPaid: boolean;
  cod: boolean;
  needAssignment: boolean;
  status: 'pending' | 'confirmed' | 'assigned_to_delivery' | 'delivery_accepted' | 'out_for_delivery' | 'delivered' | 'delivery_rejected' | 'cancelled';
  assignedAt?: string;
  acceptedAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  rejectedOrders: number;
  completionRate: number;
  averageDeliveryTimeHours: number;
}

export interface DeliveryFilters {
  page?: number;
  limit?: number;
  status?: string;
}

interface DeliveryStore {
  // State
  orders: DeliveryOrder[];
  stats: DeliveryStats | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: DeliveryFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Actions
  fetchDeliveryOrders: (newFilters?: Partial<DeliveryFilters>, isRefreshing?: boolean) => Promise<void>;
  fetchDeliveryStats: () => Promise<boolean>;
  acceptOrder: (orderId: string) => Promise<boolean>;
  rejectOrder: (orderId: string, reason: string) => Promise<boolean>;
  updateDeliveryStatus: (orderId: string, status: 'out_for_delivery' | 'delivered') => Promise<boolean>;
  setFilters: (newFilters: Partial<DeliveryFilters>) => void;
  resetFilters: () => void;

}

const initialFilters: DeliveryFilters = {
  page: 1,
  limit: 10,
};

const initialState = {
  orders: [],
  stats: null,
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

export const useDeliveryStore = create<DeliveryStore>((set, get) => ({
  ...initialState,

  // Actions
  fetchDeliveryOrders: async (newFilters?: Partial<DeliveryFilters>, isRefreshing?: boolean) => {
    try {
      console.log('Fetching delivery orders with filters:', newFilters);
      set({ isLoading: !isRefreshing, isLoadingMore: isRefreshing || false, error: null });
      
      const response = await apiClient.get('/api/v1/delivery/orders', {
        params: {
          ...get().filters,
          ...newFilters
        }
      });
      
      console.log('Delivery orders response:', response.data);
      
      if (!response.data.success) {
        console.error('API returned error:', response.data);
        throw new Error(response.data.error || 'Failed to fetch delivery orders');
      }
      
      const { orders, pagination } = response.data.data;
      
      set(state => {
        // If refreshing or first page, replace orders
        // If loading more, merge orders and remove duplicates
        const newOrders = isRefreshing || newFilters?.page === 1 
          ? orders 
          : [...state.orders, ...orders].filter((order, index, arr) => 
              arr.findIndex(o => o._id === order._id) === index
            );
        
        return {
          orders: newOrders,
          pagination: {
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            totalCount: pagination.total,
            hasNextPage: pagination.page < pagination.totalPages,
            hasPrevPage: pagination.page > 1
          },
          filters: { ...state.filters, ...newFilters },
          isLoading: false,
          isLoadingMore: false,
          error: null
        };
      });
    } catch (error: any) {
      console.error('Error fetching delivery orders:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      set({ 
        isLoading: false, 
        isLoadingMore: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch delivery orders' 
      });
    }
  },

  fetchDeliveryStats: async () => {
    try {
      console.log('Fetching delivery stats');
      
      const response = await apiClient.get('/api/v1/delivery/stats');
      
      console.log('Delivery stats response:', response.data);
      
      if (!response.data.success) {
        console.error('API returned error:', response.data);
        throw new Error(response.data.error || 'Failed to fetch delivery stats');
      }
      
      const newStats = response.data.data;
      const currentStats = get().stats;
      
      // Check if stats have improved
      let hasImprovement = false;
      if (currentStats) {
        if (newStats.completedOrders > currentStats.completedOrders) {
          hasImprovement = true;
        }
      }
      
      set({ 
        stats: newStats,
        error: null 
      });
      
      return hasImprovement;
    } catch (error) {
      console.error('Error in fetchDeliveryStats:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch delivery stats' });
      return false;
    }
  },

  acceptOrder: async (orderId: string) => {
    try {
      console.log('Accepting order:', orderId);
      
      const response = await apiClient.post(`/api/v1/delivery/orders/${orderId}/accept`);
      
      console.log('Accept order response:', response.data);
      
      if (!response.data.success) {
        console.error('API returned error:', response.data);
        throw new Error(response.data.error || 'Failed to accept order');
      }
      
      // Update local state immediately for better UX
      set(state => ({
        orders: state.orders.map(order => 
          order._id === orderId 
            ? { ...order, status: 'delivery_accepted' }
            : order
        )
      }));
      
      // Also refresh orders to get the latest data
      await get().fetchDeliveryOrders(undefined, true);
      
      return true;
    } catch (error: any) {
      console.error('Error accepting order:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      set({ error: error instanceof Error ? error.message : 'Failed to accept order' });
      return false;
    }
  },

  rejectOrder: async (orderId: string, reason: string) => {
    try {
      console.log('Rejecting order:', orderId, 'reason:', reason);
      
      const response = await apiClient.post(`/api/v1/delivery/orders/${orderId}/reject`, {
        reason
      });
      
      console.log('Reject order response:', response.data);
      
      if (!response.data.success) {
        console.error('API returned error:', response.data);
        throw new Error(response.data.error || 'Failed to reject order');
      }
      
      // Update local state immediately for better UX
      set(state => ({
        orders: state.orders.map(order => 
          order._id === orderId 
            ? { ...order, status: 'delivery_rejected', rejectionReason: reason }
            : order
        )
      }));
      
      // Also refresh orders to get the latest data
      await get().fetchDeliveryOrders(undefined, true);
      
      return true;
    } catch (error: any) {
      console.error('Error rejecting order:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      set({ error: error instanceof Error ? error.message : 'Failed to reject order' });
      return false;
    }
  },

  updateDeliveryStatus: async (orderId: string, status: 'out_for_delivery' | 'delivered') => {
    try {
      console.log('Updating delivery status:', orderId, 'to:', status);
      
      const response = await apiClient.put(`/api/v1/delivery/orders/${orderId}/status`, {
        status
      });
      
      console.log('Update delivery status response:', response.data);
      
      if (!response.data.success) {
        console.error('API returned error:', response.data);
        throw new Error(response.data.error || 'Failed to update delivery status');
      }
      
      // Update local state immediately for better UX
      set(state => ({
        orders: state.orders.map(order => 
          order._id === orderId 
            ? { ...order, status }
            : order
        )
      }));
      
      // Also refresh orders to get the latest data
      await get().fetchDeliveryOrders(undefined, true);
      
      return true;
    } catch (error: any) {
      console.error('Error updating delivery status:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      set({ error: error instanceof Error ? error.message : 'Failed to update delivery status' });
      return false;
    }
  },



  setFilters: (newFilters: Partial<DeliveryFilters>) => {
    console.log('Setting new delivery filters:', newFilters);
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  resetFilters: () => {
    console.log('Resetting delivery filters');
    set(state => ({
      filters: initialFilters
    }));
  },
})); 