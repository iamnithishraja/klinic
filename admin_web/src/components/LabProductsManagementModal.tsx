import React, { useEffect, useState, useCallback } from 'react';
import { FaBox, FaEdit, FaTrash, FaPlus, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

interface Product {
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

interface LabProductsManagementModalProps {
  lab: { _id: string; user: { _id: string; name: string } };
  onClose: () => void;
}

const LabProductsManagementModal: React.FC<LabProductsManagementModalProps> = ({ lab, onClose }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formState, setFormState] = useState<Partial<Product>>({});
  const [formLoading, setFormLoading] = useState(false);

  const resetForm = () => {
    setFormState({});
    setEditingProduct(null);
    setShowEditModal(false);
    setShowAddModal(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: name === 'price' || name === 'availableQuantity' ? Number(value) : value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      if (editingProduct) {
        // Update product
        await axios.put((import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/products/${editingProduct._id}`,
          { ...formState, user: lab.user._id },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      } else {
        // Create product
        await axios.post((import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/products`,
          { ...formState, user: lab.user._id },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      }
      await fetchProducts();
      resetForm();
    } catch {
      alert('Failed to save product.');
    } finally {
      setFormLoading(false);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/products?user=${lab.user._id}`;
      const response = await axios.get(apiUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setProducts(response.data.data?.products || []);
    } catch {
      setError('Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  }, [lab.user._id]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete((import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/products/${productId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setProducts(products.filter(p => p._id !== productId));
    } catch {
      alert('Failed to delete product.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-3xl relative">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-red-500" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><FaBox /> Products for {lab.user.name}</h2>
        <button className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2" onClick={() => { setShowAddModal(true); setFormState({}); }}><FaPlus /> Add Product</button>
        {loading ? (
          <div className="flex items-center justify-center py-8"><FaSpinner className="animate-spin text-2xl" /></div>
        ) : error ? (
          <div className="text-red-500 py-4">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-gray-500 py-4">No products found for this laboratory.</div>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Available</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id} className="border-b">
                  <td className="p-2">{product.name}</td>
                  <td className="p-2">{product.description}</td>
                  <td className="p-2">₹{product.price}</td>
                  <td className="p-2">{product.availableQuantity}</td>
                  <td className="p-2 flex gap-2">
                    <button className="text-blue-600 hover:underline flex items-center gap-1" onClick={() => { setEditingProduct(product); setFormState(product); setShowEditModal(true); }}><FaEdit /> Edit</button>
                    <button className="text-red-600 hover:underline flex items-center gap-1" onClick={() => handleDelete(product._id)}><FaTrash /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-30">
            <form className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative" onSubmit={handleFormSubmit}>
              <button className="absolute top-4 right-4 text-gray-500 hover:text-red-500" type="button" onClick={resetForm}>&times;</button>
              <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
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
              <button type="submit" disabled={formLoading} className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-2">
                {formLoading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabProductsManagementModal; 