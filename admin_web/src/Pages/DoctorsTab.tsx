import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UserCard from '../components/userCard';

const DoctorsTab: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_token');
        const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/data?type=doctors';
        const res = await axios.get(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setDoctors(res.data.profiles || []);
      } catch (err: any) {
        setError('Failed to fetch doctors');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doctor: any) => {
    const name = doctor.user?.name?.toLowerCase() || '';
    const email = doctor.user?.email?.toLowerCase() || '';
    const phone = doctor.user?.phone || '';
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
        <h1 className="text-2xl font-bold">Doctors</h1>
        <input
          type="text"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-4 py-2 w-80"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.length > 0 ? filteredDoctors.map((doctor: any) => (
          <UserCard key={doctor.user?._id || doctor._id} user={{
            _id: doctor.user?._id || '',
            name: doctor.user?.name || '',
            email: doctor.user?.email || '',
            phone: doctor.user?.phone || '',
            role: 'doctor',
            isPhoneEmailVerified: true,
            profile: doctor._id,
            createdAt: doctor.createdAt ? new Date(doctor.createdAt) : undefined,
            updatedAt: doctor.updatedAt ? new Date(doctor.updatedAt) : undefined,
          }} />
        )) : <div className="text-center col-span-3 text-icon">No doctors found.</div>}
      </div>
    </div>
  );
};

export default DoctorsTab; 