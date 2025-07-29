import React, { useState, useEffect, useCallback } from 'react';
import { FaBox, FaSearch, FaFilter, FaEye, FaTrash, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  imageUrl?: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ProductResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [toast, setToast] = useState<string | null>(null);



  // Fetch products from API
  const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      const currentFilters = newFilters || filters;
      
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice.toString());
      if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice.toString());
      if (currentFilters.page) params.append('page', currentFilters.page.toString());
      if (currentFilters.limit) params.append('limit', currentFilters.limit.toString());

      console.log('Environment variable VITE_FRONTEND_API_KEY:', import.meta.env.VITE_FRONTEND_API_KEY);
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/products?${params.toString()}`;
      
      // Get auth token
      const token = localStorage.getItem('admin_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Fetching products from:', apiUrl);
      console.log('Headers:', headers);
      
      const response = await axios.get(apiUrl, { headers });
      console.log('Products response:', response.data);
      
      if (response.data.success && response.data.data?.products) {
      setProducts(response.data.data.products);
      } else {
        console.warn('No products found or invalid response structure');
        setProducts([]);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch products:', err);
      
      if (axios.isAxiosError(err)) {
        console.error('Error response:', err.response?.data);
        
        if (err.response?.status === 401) {
          setError('Authentication failed. Please login again.');
          // Redirect to login
          localStorage.removeItem('admin_token');
          window.location.href = '/';
        } else {
          setError(err.response?.data?.message || 'Failed to load products. Please try again.');
        }
      } else {
      setError('Failed to load products. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle filter changes
  useEffect(() => {
    if (filters.page === 1) {
      fetchProducts(filters);
    }
  }, [filters.search, filters.minPrice, filters.maxPrice]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1
    }));
  };

  // Handle view product details
  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  // Handle delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/products/${productId}`;
      
      // Get auth token
      const token = localStorage.getItem('admin_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.delete(apiUrl, { headers });
      await fetchProducts(); // Refresh the list
      setToast('Product deleted successfully!');
    } catch (error: unknown) {
      console.error('Failed to delete product:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          alert('Authentication failed. Please login again.');
          localStorage.removeItem('admin_token');
          window.location.href = '/';
        } else {
          setToast(error.response?.data?.message || 'Failed to delete product.');
        }
      } else {
      setToast('Failed to delete product.');
      }
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <FaSpinner className="animate-spin text-blue-600 text-xl" />
          <span className="text-gray-600">Loading products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaBox className="text-red-600 text-2xl" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading products</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => fetchProducts()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FaBox className="text-blue-600 text-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
            <p className="text-sm text-gray-500">Manage all products across laboratories</p>
          </div>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products by name or description..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Min Price</option>
              <option value="0">₹0</option>
              <option value="100">₹100</option>
              <option value="500">₹500</option>
              <option value="1000">₹1000</option>
            </select>
            <select
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Max Price</option>
              <option value="100">₹100</option>
              <option value="500">₹500</option>
              <option value="1000">₹1000</option>
              <option value="5000">₹5000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            {/* Product Image */}
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaBox className="text-gray-400 text-4xl" />
              )}
            </div>

            {/* Product Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{product.description}</p>
                {product.user && (
                  <div className="mb-3 p-2 bg-purple-50 rounded border border-purple-200">
                    <p className="text-xs text-purple-700 font-medium">Added by:</p>
                    <p className="text-xs text-purple-600">{product.user.name}</p>
                    <p className="text-xs text-purple-500">{product.user.email}</p>
                    <p className="text-xs text-purple-500">{product.user.phone}</p>
                  </div>
                )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                    <span className="text-sm text-gray-500">{product.availableQuantity} in stock</span>
                  </div>
                </div>
              </div>

              {/* Product Meta */}
              <div className="border-t border-gray-100 pt-4 mb-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Created: {formatDate(product.createdAt)}</span>
                  <span>ID: {product._id.slice(-8)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewDetails(product)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FaEye className="text-sm" />
                  View Details
                </button>
                <button
                  onClick={() => handleDeleteProduct(product._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBox className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Products will appear here once they are created by laboratories.</p>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FaBox className="text-gray-400 text-2xl" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-2xl font-bold text-blue-600">₹{selectedProduct.price}</p>
                  <p className="text-sm text-gray-500">{selectedProduct.availableQuantity} in stock</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedProduct.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Product ID</h4>
                  <p className="text-sm text-gray-600">{selectedProduct._id}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                  <p className="text-sm text-gray-600">{formatDate(selectedProduct.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Last Updated</h4>
                  <p className="text-sm text-gray-600">{formatDate(selectedProduct.updatedAt)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Laboratory ID</h4>
                                      <p className="text-sm text-gray-600">{selectedProduct.user ? selectedProduct.user.name : 'Unknown User'}</p>
                    {selectedProduct.user && (
                      <>
                        <p className="text-xs text-gray-500">{selectedProduct.user.email}</p>
                        <p className="text-xs text-gray-500">{selectedProduct.user.phone}</p>
                      </>
                    )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {false && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-30">
          <form className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative" onSubmit={handleFormSubmit}>
            <button className="absolute top-4 right-4 text-gray-500 hover:text-red-500" type="button" onClick={resetForm} aria-label="Close Add Product Modal">&times;</button>
            <h3 className="text-xl font-bold mb-4">Add Product</h3>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Name</label>
              <input name="name" value={formState.name || ''} onChange={handleFormChange} required className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Description</label>
              <textarea name="description" value={formState.description || ''} onChange={handleFormChange} required className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Price</label>
              <input name="price" type="number" min="0" value={formState.price || ''} onChange={handleFormChange} required className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Available Quantity</label>
              <input name="availableQuantity" type="number" min="0" value={formState.availableQuantity || ''} onChange={handleFormChange} required className="w-full border rounded-lg px-3 py-2" />
            </div>
            <button type="submit" disabled={formLoading} className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-2">
              {formLoading ? 'Saving...' : 'Add Product'}
            </button>
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out" role="alert">{toast}</div>
      )}
    </div>
  );
};

export default ProductsTab; 