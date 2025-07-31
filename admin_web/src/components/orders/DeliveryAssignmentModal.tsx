import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaPhone, FaEnvelope, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

interface DeliveryPartner {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface DeliveryAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onAssign: (deliveryPartnerId: string) => void;
}

const DeliveryAssignmentModal: React.FC<DeliveryAssignmentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onAssign
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    const fetchDeliveryPartners = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/delivery-partners';
        const res = await fetch(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          setDeliveryPartners(data.data || []);
        } else {
          throw new Error(data.error || 'Failed to fetch delivery partners');
        }
      } catch (err) {
        setError('Failed to fetch delivery partners');
        console.error('Error fetching delivery partners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveryPartners();
  }, [isOpen]);

  const filteredPartners = deliveryPartners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.phone.includes(searchTerm)
  );

  const handleAssign = async () => {
    if (!selectedPartner) return;
    
    try {
      setIsAssigning(true);
      await onAssign(selectedPartner._id);
      onClose();
    } catch (error) {
      console.error('Failed to assign delivery partner:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaUser className="text-blue-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Assign Delivery Partner</h2>
              <p className="text-sm text-gray-500">Order ID: {orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-light focus:outline-none transition-colors"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Delivery Partners
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-blue-600 text-2xl mr-3" />
              <span className="text-gray-600">Loading delivery partners...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUser className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading delivery partners</h3>
              <p className="text-gray-500">{error}</p>
            </div>
          )}

          {/* Delivery Partners List */}
          {!loading && !error && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPartners.length === 0 ? (
                <div className="text-center py-8">
                  <FaUser className="text-gray-400 text-4xl mx-auto mb-4" />
                  <p className="text-gray-500">No delivery partners found</p>
                </div>
              ) : (
                filteredPartners.map((partner) => (
                  <div
                    key={partner._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPartner?._id === partner._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPartner(partner)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <div className="flex items-center gap-1">
                                <FaEnvelope className="text-gray-400" />
                                <span>{partner.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaPhone className="text-gray-400" />
                                <span>{partner.phone}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {selectedPartner?._id === partner._id && (
                        <FaCheckCircle className="text-blue-600 text-xl" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedPartner || isAssigning}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedPartner && !isAssigning
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAssigning ? (
                <>
                  <FaSpinner className="animate-spin inline mr-2" />
                  Assigning...
                </>
              ) : (
                'Assign Delivery Partner'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAssignmentModal; 