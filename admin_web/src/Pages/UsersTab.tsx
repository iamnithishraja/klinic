import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import UserCard from '../components/userCard';
import { useNavigate } from 'react-router-dom';
import { debounce } from '../utils/debounce';
import { FaTimes, FaSpinner, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<{
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    isPhoneEmailVerified?: boolean;
    profile?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authorized
    if (!localStorage.getItem('admin_token')) {
      navigate('/');
      return;
    }
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/data?type=users';
      const res = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUsers(res.data.users || []);
      setTotalUsers(res.data.total || 0);
    } catch {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const name = user.name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const phone = user.phone || '';
    const searchLower = search.toLowerCase();
    return (
      user.role === 'user' &&
      (name.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(search))
    );
  });

  // Debounced search function
  const debouncedFetchUsers = useMemo(() => debounce(fetchUsers, 300), []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedFetchUsers();
  };

  return (
    <div className="p-8 bg-background min-h-screen" style={{ color: 'var(--color-text)', background: 'var(--color-background)' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text">Users ({totalUsers})</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            value={search}
            onChange={handleSearchChange}
            className="px-4 py-2 border border-icon rounded-lg focus:outline-none focus:ring-2 focus:ring-tint text-text bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchUsers();
              }}
              className="px-4 py-2 bg-icon text-background rounded-lg hover:bg-tabIconDefault focus:outline-none focus:ring-2 focus:ring-icon flex items-center gap-2"
            >
              <FaTimes className="text-lg" />
              Clear
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-icon flex flex-col items-center justify-center">
          <FaSpinner className="animate-spin text-tint text-3xl mb-2" />
          Loading...
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8 flex flex-col items-center justify-center">
          <FaExclamationCircle className="text-3xl mb-2" />
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => <UserCard key={user._id || ''} user={{
              _id: user._id || '',
              name: user.name || '',
              email: user.email || '',
              phone: user.phone || '',
              role: (user.role || 'user') as 'user' | 'admin' | 'doctor' | 'laboratory' | 'deliverypartner',
              isPhoneEmailVerified: user.isPhoneEmailVerified ?? false,
              profile: user.profile || '',
              createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
              updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
            }} />)
          ) : (
            <div className="text-center text-icon py-8 flex flex-col items-center justify-center">
              <FaInfoCircle className="text-2xl mb-2" />
              {search ? `No users found matching "${search}"` : 'No users found.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsersTab; 