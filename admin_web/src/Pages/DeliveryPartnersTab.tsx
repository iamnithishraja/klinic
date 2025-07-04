import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import UserCard from '../components/userCard';

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
  createdAt?: string;
  updatedAt?: string;
  // Add other fields as needed
}

const DeliveryPartnersTab: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartnerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/data?type=deliverypartners';
      const res = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPartners(res.data.profiles || []);
    } catch {
      setError('Failed to fetch delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    fetchPartners();
  }, []);

  const filteredPartners = partners.filter((partner: DeliveryPartnerProfile) => {
    const name = partner.user?.name?.toLowerCase() || '';
    const email = partner.user?.email?.toLowerCase() || '';
    const phone = partner.user?.phone || '';
    const searchLower = search.toLowerCase();
    // Accept delivery partner if user.role is 'deliverypartner'
    const isPartner = partner.user && partner.user.role === 'deliverypartner';
    return (
      isPartner &&
      (name.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(search))
    );
  });

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPartners();
    setRefreshing(false);
    setPullDistance(0);
  };

  // Touch events for mobile pull-to-refresh
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

  // Wheel event for desktop pull-to-refresh
  const handleWheel = (e: React.WheelEvent) => {
    if (window.scrollY === 0 && e.deltaY < -40) {
      handleRefresh();
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Delivery Partners</h1>
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPartners.length > 0 ? filteredPartners.map((partner: DeliveryPartnerProfile) => (
            <div key={partner.user?._id || partner._id} className="animate-fade-in">
              <UserCard user={{
                _id: partner.user?._id || '',
                name: partner.user?.name || '',
                email: partner.user?.email || '',
                phone: partner.user?.phone || '',
                role: 'deliverypartner',
                isPhoneEmailVerified: true,
                profile: partner._id,
                createdAt: partner.createdAt ? new Date(partner.createdAt) : undefined,
                updatedAt: partner.updatedAt ? new Date(partner.updatedAt) : undefined,
              }} />
            </div>
          )) : <div className="text-center col-span-3 text-icon">No delivery partners found.</div>}
        </div>
      </div>
    </div>
  );
};

export default DeliveryPartnersTab; 