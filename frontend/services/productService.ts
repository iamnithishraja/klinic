import apiClient from '../api/client';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  imageUrl?: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  imageUrl?: string;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProductSearchFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ProductSearchResponse {
  products: Product[];
  pagination: PaginationData;
}

export const productService = {
  searchProducts: async (filters: ProductSearchFilters): Promise<ProductSearchResponse> => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const queryString = queryParams.toString();
      console.log('=== PRODUCT SEARCH DEBUG ===');
      console.log('Original filters:', filters);
      console.log('Query string:', queryString);
      console.log('Final Query String being sent:', `/api/v1/products?${queryString}`)
      console.log('API Request URL:', `/api/v1/products?${queryString}`);
      console.log('Filters being sent:', filters);
      console.log('===========================');
      
      const response = await apiClient.get(`/api/v1/products?${queryString}`);
      
      console.log('API Response:', JSON.stringify(response.data));
      
      if (!response.data.data?.products || response.data.data.products.length === 0) {
        console.warn('No products found in the response. Using fallback data.');
        
        return {
          products: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }
      
      // Transform the response to match expected structure
      return {
        products: response.data.data.products,
        pagination: {
          currentPage: response.data.data.pagination.page,
          totalPages: response.data.data.pagination.totalPages,
          totalCount: response.data.data.pagination.total,
          hasNextPage: response.data.data.pagination.page < response.data.data.pagination.totalPages,
          hasPrevPage: response.data.data.pagination.page > 1
        }
      };
    } catch (error: any) {
      console.error('=== PRODUCT SEARCH ERROR ===');
      console.error('Error searching products:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request params:', error.config?.params);
      console.error('==========================');
      
      return {
        products: [],
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

  getProductById: async (productId: string): Promise<Product | null> => {
    try {
      const response = await apiClient.get(`/api/v1/products/${productId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching product by ID:', error);
      console.error('Error details:', error.response?.data || error.message);
      return null;
    }
  },

  createProduct: async (productData: CreateProductData): Promise<Product> => {
    try {
      const response = await apiClient.post('/api/v1/products', productData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating product:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  getMyProducts: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get('/api/v1/products/my-products');
      return response.data.data.products || [];
    } catch (error: any) {
      console.error('Error fetching my products:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  updateProduct: async (productId: string, productData: Partial<CreateProductData>): Promise<Product> => {
    try {
      const response = await apiClient.put(`/api/v1/products/${productId}`, productData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating product:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteProduct: async (productId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/products/${productId}`);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  }
}; 