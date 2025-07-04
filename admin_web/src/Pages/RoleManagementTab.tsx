import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaUserShield, FaUser, FaUserMd, FaFlask, FaTruck, FaEdit, FaTrash, FaSpinner, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user' | 'doctor' | 'laboratory' | 'deliverypartner';
  isPhoneEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoleStats {
  _id: string;
  count: number;
}

const RoleManagementTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [showRemoveAdminModal, setShowRemoveAdminModal] = useState(false);
  const [removingAdmin, setRemovingAdmin] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/users/roles?page=${currentPage}&search=${search}&role=${roleFilter}`;
      const res = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUsers(res.data.users || []);
      setRoleStats(res.data.roleStats || []);
      setTotalUsers(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
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

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    setUpdatingRole(true);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/users/${selectedUser._id}/role`;
      const res = await axios.put(apiUrl, 
        { newRole },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      
      // Update the user in the list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === selectedUser._id 
            ? { ...user, role: newRole as any }
            : user
        )
      );
      
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
      alert(res.data.message);
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert(error.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedUser) return;
    
    setRemovingAdmin(true);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/users/${selectedUser._id}/admin-role`;
      const res = await axios.delete(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      // Update the user in the list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === selectedUser._id 
            ? { ...user, role: 'user' as any }
            : user
        )
      );
      
      setShowRemoveAdminModal(false);
      setSelectedUser(null);
      alert(res.data.message);
    } catch (error: any) {
      console.error('Error removing admin role:', error);
      alert(error.response?.data?.message || 'Failed to remove admin role');
    } finally {
      setRemovingAdmin(false);
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const openRemoveAdminModal = (user: User) => {
    setSelectedUser(user);
    setShowRemoveAdminModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <FaUserShield className="text-red-500" />;
      case 'doctor': return <FaUserMd className="text-blue-500" />;
      case 'laboratory': return <FaFlask className="text-green-500" />;
      case 'deliverypartner': return <FaTruck className="text-orange-500" />;
      default: return <FaUser className="text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'laboratory': return 'bg-green-100 text-green-800';
      case 'deliverypartner': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, roleFilter]);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const filteredUsers = users.filter((user) => {
    const name = user.name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const phone = user.phone || '';
    const searchLower = search.toLowerCase();
    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(search)
    );
  });

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
      
      <div className="bg-card rounded-xl shadow p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Role Management</h1>
          <p className="text-gray-600">Manage user roles and permissions across the platform</p>
        </div>

        {/* Role Statistics */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {roleStats.map((stat) => (
            <div key={stat._id} className="bg-white rounded-lg p-4 shadow border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getRoleIcon(stat._id)}
                  <span className="font-semibold capitalize">{stat._id}</span>
                </div>
                <span className="text-2xl font-bold text-gray-700">{stat.count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name, email, or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-80"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="doctor">Doctor</option>
              <option value="laboratory">Laboratory</option>
              <option value="deliverypartner">Delivery Partner</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Total Users: {totalUsers}
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-12">
            <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user._id} className="bg-white rounded-lg p-6 shadow border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.phone}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            {user.role}
                          </span>
                          {user.isPhoneEmailVerified && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaCheckCircle />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openRoleModal(user)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <FaEdit />
                        Change Role
                      </button>
                      {user.role === 'admin' && (
                        <button
                          onClick={() => openRemoveAdminModal(user)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                          <FaTrash />
                          Remove Admin
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No users found matching your criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-primary text-white rounded-lg">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Change User Role</h2>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">User: <strong>{selectedUser.name}</strong></p>
              <p className="text-gray-600 mb-4">Current Role: <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                {getRoleIcon(selectedUser.role)}
                {selectedUser.role}
              </span></p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="laboratory">Laboratory</option>
                <option value="deliverypartner">Delivery Partner</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setNewRole('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={updatingRole || newRole === selectedUser.role}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updatingRole ? <FaSpinner className="animate-spin" /> : <FaEdit />}
                {updatingRole ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Admin Modal */}
      {showRemoveAdminModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Remove Admin Privileges</h2>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">Are you sure you want to remove admin privileges from:</p>
              <p className="font-semibold text-lg">{selectedUser.name}</p>
              <p className="text-gray-600">{selectedUser.email}</p>
              <p className="text-sm text-red-600 mt-2">This action will change their role to "User" and they will lose all admin access.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemoveAdminModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveAdmin}
                disabled={removingAdmin}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {removingAdmin ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                {removingAdmin ? 'Removing...' : 'Remove Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementTab; 