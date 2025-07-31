import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaFlask, FaMapMarkerAlt, FaCheck, FaEnvelope, FaPhone } from 'react-icons/fa';

interface Laboratory {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  laboratoryName: string;
  laboratoryEmail: string;
  laboratoryPhone: string;
  city: string;
  isAvailable: boolean;
  email?: string;
  phone?: string;
}

interface LabAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onAssign: (labId: string) => void;
}

const LabAssignmentModal: React.FC<LabAssignmentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onAssign
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLab, setSelectedLab] = useState<Laboratory | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for advanced search
  const [advancedSearchTerm, setAdvancedSearchTerm] = useState('');
  const [advancedSearchResult, setAdvancedSearchResult] = useState<Laboratory | null>(null);
  const [advancedSearchError, setAdvancedSearchError] = useState<string | null>(null);
  const [advancedSearchLoading, setAdvancedSearchLoading] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    const fetchLabs = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/data?type=laboratories';
        const res = await fetch(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setLaboratories(data.profiles || []);
      } catch {
        setError('Failed to fetch laboratories');
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, [isOpen]);

  const filteredLabs = laboratories.filter(lab =>
    (lab.laboratoryName && lab.laboratoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lab.city && lab.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAssign = async () => {
    if (!selectedLab) return;
    
    setIsAssigning(true);
    try {
      console.log('Assigning lab:', selectedLab);
      // Call the onAssign function with the selected laboratory ID
      onAssign(selectedLab._id);
      onClose();
    } catch (error) {
      console.error('Failed to assign laboratory:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Add handler for advanced search
  const handleAdvancedSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvancedSearchLoading(true);
    setAdvancedSearchError(null);
    setAdvancedSearchResult(null);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/data?type=laboratories&search=${encodeURIComponent(advancedSearchTerm)}`;
      const res = await fetch(apiUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.profiles && data.profiles.length > 0) {
        setAdvancedSearchResult(data.profiles[0]);
      } else {
        setAdvancedSearchError('No laboratory found with that email or phone number.');
      }
    } catch {
      setAdvancedSearchError('Failed to search. Please try again.');
    } finally {
      setAdvancedSearchLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaFlask className="text-orange-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Assign Laboratory</h2>
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search laboratories by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>
          </div>

          {/* Laboratories List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">Loading laboratories...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : filteredLabs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No laboratories found.
              </div>
            ) : (
              filteredLabs.map((lab) => (
                <div
                  key={lab._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedLab?._id === lab._id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                  }`}
                  onClick={() => setSelectedLab(selectedLab?._id === lab._id ? null : lab)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaFlask className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {lab.laboratoryName || lab.user?.name || 'Unnamed Laboratory'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FaMapMarkerAlt className="text-gray-400" />
                        {lab.city || 'Location not specified'}
                      </div>
                      {lab.user?.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FaEnvelope className="text-gray-400" />
                          {lab.user.email}
                        </div>
                      )}
                    </div>
                    {selectedLab?._id === lab._id && (
                      <FaCheck className="text-orange-600" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Advanced Search Section */}
          {filteredLabs.length === 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {!showAdvancedSearch ? (
                <button
                  type="button"
                  onClick={() => setShowAdvancedSearch(true)}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  Assign by Number or Email
                </button>
              ) : (
                <div className="space-y-3">
                  <form onSubmit={handleAdvancedSearch} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search by email or phone number"
                      value={advancedSearchTerm}
                      onChange={e => setAdvancedSearchTerm(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={advancedSearchLoading || !advancedSearchTerm}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {advancedSearchLoading ? 'Searching...' : 'Search'}
                    </button>
                  </form>
                  {advancedSearchError && <div className="text-red-500 text-sm">{advancedSearchError}</div>}
                  {advancedSearchResult && (
                    <div
                      className="p-4 border border-orange-500 rounded-lg cursor-pointer transition-all duration-200 bg-orange-50"
                      onClick={() => setSelectedLab(selectedLab?._id === advancedSearchResult._id ? null : advancedSearchResult)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FaFlask className="text-purple-600 text-sm" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{advancedSearchResult.laboratoryName || advancedSearchResult.user?.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FaEnvelope className="text-gray-400" />
                            {advancedSearchResult.laboratoryEmail || advancedSearchResult.user?.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FaPhone className="text-gray-400" />
                            {advancedSearchResult.laboratoryPhone || advancedSearchResult.user?.phone}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedLab?._id === advancedSearchResult._id ? 'Click to deselect' : 'Click to select this laboratory'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected Lab Preview */}
          {selectedLab && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Selected Laboratory</h4>
                <button
                  type="button"
                  onClick={() => setSelectedLab(null)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear Selection
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaFlask className="text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedLab.laboratoryName || selectedLab.user?.name}</p>
                  <p className="text-sm text-gray-600">{selectedLab.city}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedLab || isAssigning}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isAssigning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <FaCheck className="text-sm" />
                  Assign Laboratory
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabAssignmentModal; 