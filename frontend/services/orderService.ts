import apiClient from '../api/client';

export interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  quantity?: number;
}

export interface Order {
  _id: string;
  orderedBy: string;
  laboratoryUser?: string;
  deliveryPartner?: string;
  products?: Array<{
    product: Product;
    quantity: number;
  }>;
  prescription?: string;
  totalPrice: number;
  isPaid: boolean;
  needAssignment: boolean;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  assignedOnly?: boolean;
  unassignedOnly?: boolean;
}

export interface OrderResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UpdateOrderStatusData {
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
}

export interface CreateOrderData {
  products?: Array<{
    product: string;
    quantity: number;
  }>;
  prescription?: string;
  totalPrice?: number;
  needAssignment: boolean;
  laboratoryUser?: string;
}

export const orderService = {
  createOrder: async (orderData: CreateOrderData): Promise<Order> => {
    try {
      console.log('Creating order with data:', orderData);
      const response = await apiClient.post('/api/v1/orders', orderData);
      console.log('Order created successfully:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  getMyOrders: async (filters: OrderFilters): Promise<OrderResponse> => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const queryString = queryParams.toString();
      const url = `/api/v1/orders/my-orders?${queryString}`;
      console.log('API Request URL:', url);
      console.log('Filters being sent:', filters);
      
      const response = await apiClient.get(url);
      
      console.log('API Response:', JSON.stringify(response.data, null, 2));
      
      if (!response.data.success) {
        console.error('API returned error:', response.data);
        throw new Error(response.data.error || 'Failed to fetch orders');
      }
      
      if (!response.data.data?.orders || response.data.data.orders.length === 0) {
        console.warn('No orders found in the response. Using fallback data.');
        
        return {
          orders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }
      
      const result = {
        orders: response.data.data.orders,
        pagination: {
          currentPage: response.data.data.pagination.page,
          totalPages: response.data.data.pagination.totalPages,
          totalCount: response.data.data.pagination.total,
          hasNextPage: response.data.data.pagination.page < response.data.data.pagination.totalPages,
          hasPrevPage: response.data.data.pagination.page > 1
        }
      };
      
      console.log('Processed orders response:', result);
      return result;
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      return {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }
  },

  getLabOrders: async (filters: OrderFilters): Promise<OrderResponse> => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const queryString = queryParams.toString();
      const url = `/api/v1/orders/lab-orders?${queryString}`;
      console.log('API Request URL:', url);
      console.log('Filters being sent:', filters);
      
      const response = await apiClient.get(url);
      
      console.log('API Response:', JSON.stringify(response.data, null, 2));
      
      if (!response.data.success) {
        console.error('API returned error:', response.data);
        throw new Error(response.data.error || 'Failed to fetch lab orders');
      }
      
      if (!response.data.data?.orders || response.data.data.orders.length === 0) {
        console.warn('No lab orders found in the response. Using fallback data.');
        
        return {
          orders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }
      
      const result = {
        orders: response.data.data.orders,
        pagination: {
          currentPage: response.data.data.pagination.page,
          totalPages: response.data.data.pagination.totalPages,
          totalCount: response.data.data.pagination.total,
          hasNextPage: response.data.data.pagination.page < response.data.data.pagination.totalPages,
          hasPrevPage: response.data.data.pagination.page > 1
        }
      };
      
      console.log('Processed lab orders response:', result);
      return result;
    } catch (error: any) {
      console.error('Error fetching lab orders:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      return {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }
  },

  getOrderById: async (orderId: string): Promise<Order | null> => {
    try {
      console.log('Fetching order by ID:', orderId);
      const response = await apiClient.get(`/api/v1/orders/${orderId}`);
      console.log('Order by ID response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching order by ID:', error);
      console.error('Error details:', error.response?.data || error.message);
      return null;
    }
  },

  claimOrder: async (orderId: string): Promise<Order> => {
    try {
      console.log('Claiming order:', orderId);
      const response = await apiClient.post(`/api/v1/orders/${orderId}/claim`);
      console.log('Claim order response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error claiming order:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  updateOrderStatus: async (orderId: string, statusData: UpdateOrderStatusData): Promise<Order> => {
    try {
      console.log('Updating order status:', orderId, 'to:', statusData.status);
      const response = await apiClient.put(`/api/v1/orders/${orderId}/status`, statusData);
      console.log('Update order status response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating order status:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  }
}; 