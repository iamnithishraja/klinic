import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
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

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Delivery Partners</h1>
        <input
          type="text"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-4 py-2 w-80"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.length > 0 ? filteredPartners.map((partner: DeliveryPartnerProfile) => (
          <UserCard key={partner.user?._id || partner._id} user={{
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
        )) : <div className="text-center col-span-3 text-icon">No delivery partners found.</div>}
      </div>
    </div>
  );
};

export default DeliveryPartnersTab; 