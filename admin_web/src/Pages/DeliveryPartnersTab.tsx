import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaTruck, FaUser, FaPhone, FaEnvelope, FaSpinner, FaExclamationTriangle, FaInfoCircle, FaEye } from 'react-icons/fa';
import DeliveryPartnerDetailsModal from '../components/DeliveryPartnerDetailsModal';

// Define DeliveryPartnerProfile type for this file
interface DeliveryPartnerProfile {
  _id: string;
  user?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  city?: string;
  vehicleNumber?: string;
}

const DeliveryPartnersTab: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartnerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = `${import.meta.env.VITE_FRONTEND_API_KEY}/api/v1/admin/data?type=deliverypartners`;
      const res = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPartners(res.data.profiles || []);
    } catch (err) {
      setError('Failed to fetch delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const filteredPartners = partners.filter((partner) => {
    const name = partner.user?.name?.toLowerCase() || '';
    const email = partner.user?.email?.toLowerCase() || '';
    const phone = partner.user?.phone || '';
    const city = partner.city?.toLowerCase() || '';
    const searchLower = search.toLowerCase();
    const isPartner = partner.user && partner.user.role === 'deliverypartner';

    return (
      isPartner &&
      (name.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(search) ||
        city.includes(searchLower))
    );
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPartners();
    setRefreshing(false);
    setPullDistance(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const distance = e.touches[0].clientY - touchStartY;
      if (distance > 0) setPullDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
    setTouchStartY(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (window.scrollY === 0 && e.deltaY < -40) {
      handleRefresh();
    }
  };

  const handleViewDetails = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedPartnerId(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-icon flex flex-col items-center justify-center">
        <FaSpinner className="animate-spin text-tint text-3xl mb-2" />
        Loading delivery partners...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8 flex flex-col items-center justify-center">
        <FaExclamationTriangle className="text-3xl mb-2" />
        {error}
      </div>
    );
  }

  return (
    <div
      ref={mainContentRef}
      className="main-content flex flex-col items-stretch"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ transform: pullDistance ? `translateY(${pullDistance}px)` : undefined, transition: refreshing ? 'none' : 'transform 0.2s' }}
    >
      {refreshing && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="bg-card rounded-xl shadow p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaTruck className="text-blue-600 text-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Delivery Partners</h1>
              <p className="text-sm text-gray-500">{filteredPartners.length} partners found</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by name, email, phone, or city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Refresh"
              >
                <FaSpinner className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.length > 0 ? (
            filteredPartners.map((partner) => (
              <div key={partner.user?._id || partner._id} className="animate-fade-in">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaTruck className="text-blue-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{partner.user?.name || 'Unknown Partner'}</h3>
                        <p className="text-sm text-gray-500">Delivery Partner</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaEnvelope className="text-gray-400" />
                      {partner.user?.email || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaPhone className="text-gray-400" />
                      {partner.user?.phone || 'N/A'}
                    </div>
                    {partner.city && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaUser className="text-gray-400" />
                        {partner.city}
                      </div>
                    )}
                    {partner.vehicleNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaTruck className="text-gray-400" />
                        Vehicle: {partner.vehicleNumber}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(partner._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <FaEye className="text-sm" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center col-span-3 text-icon py-12 flex flex-col items-center justify-center">
              <FaInfoCircle className="text-4xl mb-4" />
              <p className="text-lg font-medium mb-2">
                {search
                  ? `No delivery partners found matching your criteria`
                  : 'No delivery partners found'}
              </p>
              <p className="text-sm text-gray-500">
                {search
                  ? 'Try adjusting your search terms or filters'
                  : 'Delivery partners will appear here once they register'}
              </p>
            </div>
          )}
        </div>
      </div>

      <DeliveryPartnerDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetails}
        partnerId={selectedPartnerId}
      />
    </div>
  );
};

export default DeliveryPartnersTab;
 