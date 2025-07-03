import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UserCard from '../components/userCard';

// Define LaboratoryProfile type for this file
interface LaboratoryProfile {
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

const LaboratoriesTab: React.FC = () => {
  const [laboratories, setLaboratories] = useState<LaboratoryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLaboratories = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_token');
        const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/data?type=laboratories';
        const res = await axios.get(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setLaboratories(res.data.profiles || []);
      } catch {
        setError('Failed to fetch laboratories');
      } finally {
        setLoading(false);
      }
    };
    fetchLaboratories();
  }, []);

  const filteredLabs = laboratories.filter((lab: LaboratoryProfile) => {
    const name = lab.user?.name?.toLowerCase() || '';
    const email = lab.user?.email?.toLowerCase() || '';
    const phone = lab.user?.phone || '';
    const searchLower = search.toLowerCase();
    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(search)
    );
  });

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Laboratories</h1>
        <input
          type="text"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-4 py-2 w-80"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLabs.length > 0 ? filteredLabs.map((lab: LaboratoryProfile) => (
          <UserCard key={lab.user?._id || lab._id} user={{
            _id: lab.user?._id || '',
            name: lab.user?.name || '',
            email: lab.user?.email || '',
            phone: lab.user?.phone || '',
            role: 'laboratory',
            isPhoneEmailVerified: true,
            profile: lab._id,
            createdAt: lab.createdAt ? new Date(lab.createdAt) : undefined,
            updatedAt: lab.updatedAt ? new Date(lab.updatedAt) : undefined,
          }} />
        )) : <div className="text-center col-span-3 text-icon">No laboratories found.</div>}
      </div>
    </div>
  );
};

export default LaboratoriesTab; 