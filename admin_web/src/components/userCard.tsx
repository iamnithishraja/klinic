import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaClock, FaBan, FaUserTimes, FaUserCheck } from 'react-icons/fa';
import SuspensionModal from './SuspensionModal';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user' | 'doctor' | 'laboratory' | 'deliverypartner';
  isPhoneEmailVerified: boolean;
  profile?: string; // profile ObjectId for non-user roles
  isVerified?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface UserProfileDetails {
  email?: string;
  phone?: string;
  gender?: string;
  age?: number;
  city?: string;
  address?: { address?: string; latitude?: number; longitude?: number; pinCode?: string };
  profilePicture?: string;
  medicalHistory?: string;
  medicalHistoryPdfs?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface SuspensionDetails {
  _id: string;
  email?: string;
  phone?: string;
  reason: string;
  suspendedBy: {
    _id: string;
    name: string;
    email: string;
  };
  suspendedAt: string;
  expiresAt?: string;
  isActive: boolean;
  notes?: string;
}

interface UserCardProps {
  user: User;
  disableModal?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, disableModal = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [profileDetails, setProfileDetails] = useState<UserProfileDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionDetails, setSuspensionDetails] = useState<SuspensionDetails | null>(null);

  // Check suspension status on component mount
  useEffect(() => {
    checkSuspensionStatus();
  }, [user._id]);

  const checkSuspensionStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/users/${user._id}/suspension-status`;
      const response = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setIsSuspended(response.data.isSuspended);
      setSuspensionDetails(response.data.suspension);
    } catch (error) {
      console.error('Failed to check suspension status:', error);
    }
  };

  const handleCardClick = async () => {
    if (disableModal) return;
    setShowModal(true);
    setLoading(true);
    setProfileDetails(null);
    setError('');
    try {
      // Determine endpoint and id based on user role
      let endpoint = '';
      let id = '';
      let type = '';
      switch (user.role) {
        case 'doctor':
        case 'laboratory':
        case 'deliverypartner': {
          id = user.profile || '';
          if (!id) throw new Error('Profile ID not found');
          // Map role to type param
          if (user.role === 'doctor') type = 'doctors';
          else if (user.role === 'laboratory') type = 'laboratories';
          else if (user.role === 'deliverypartner') type = 'deliverypartners';
          endpoint = `/api/v1/admin/data/${id}?type=${type}`;
          break;
        }
        case 'user':
        default:
          id = user._id || '';
          if (!id) throw new Error('User ID not found');
          endpoint = `/api/v1/admin/user-profile/by-user/${id}`;
          break;
      }
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + endpoint;
      const token = localStorage.getItem('admin_token');
      const res = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setProfileDetails(res.data);
    } catch (error) {
      setError('Failed to fetch profile details');
      // eslint-disable-next-line no-console
      console.error('Failed to fetch profile details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspensionChange = () => {
    checkSuspensionStatus();
  };

  return (
    <>
      <div
        className="relative bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-6 flex items-center gap-6 transition-transform duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer group overflow-hidden"
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}
        onClick={handleCardClick}
      >
        {/* Profile Image/Initial */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-200 ${isSuspended ? 'opacity-50' : ''}`}>
            {user.name?.charAt(0).toUpperCase() || '?'}
          </div>
          {/* Status Badge */}
          {user.role !== 'user' && (
            <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full shadow-lg flex items-center gap-1 text-xs font-semibold ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} border border-white`}
              style={{ zIndex: 2 }}
            >
              {user.isVerified ? <FaCheckCircle className="text-green-500 mr-1" /> : <FaClock className="text-yellow-500 mr-1" />}
              {user.isVerified ? 'Verified' : 'Pending'}
            </div>
          )}
          {/* Suspension Badge */}
          {isSuspended && (
            <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full shadow-lg flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 border border-white"
              style={{ zIndex: 2 }}
            >
              <FaBan className="text-red-500 mr-1" />
              Suspended
            </div>
          )}
        </div>
        {/* Card Content */}
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold text-gray-900 truncate mb-1">{user.name}</div>
          <div className="text-sm text-gray-500 truncate mb-1">{user.email}</div>
          <div className="text-xs text-gray-400">{user.phone}</div>
          <div className="mt-2 flex gap-2">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium shadow-sm capitalize">{user.role}</span>
            {user.createdAt && (
              <span className="inline-block px-2 py-1 rounded-full bg-gray-50 text-gray-400 text-xs font-medium shadow-sm">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            )}
            {isSuspended && suspensionDetails && (
              <span className="inline-block px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium shadow-sm">
                {suspensionDetails.expiresAt ? 'Temp Suspended' : 'Permanently Suspended'}
              </span>
            )}
          </div>
        </div>
        {/* Suspension Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSuspensionModal(true);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            isSuspended 
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
              : 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
          }`}
        >
          {isSuspended ? <FaUserCheck className="text-lg" /> : <FaUserTimes className="text-lg" />}
          {isSuspended ? 'Unsuspend' : 'Suspend'}
        </button>
      </div>

      {/* Suspension Modal */}
      <SuspensionModal
        isOpen={showSuspensionModal}
        onClose={() => setShowSuspensionModal(false)}
        userId={user._id}
        userName={user.name}
        userEmail={user.email}
        userPhone={user.phone}
        isCurrentlySuspended={isSuspended}
        onSuspensionChange={handleSuspensionChange}
      />

      {/* Profile Modal for user role */}
      {showModal && user.role === 'user' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden">
                  {profileDetails?.profilePicture ? (
                    <img src={profileDetails.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    user.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">{user.name}</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize ml-2">User</span>
                  {isSuspended && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 ml-2 flex items-center gap-1">
                      <FaBan className="text-xs" />
                      Suspended
                    </span>
                  )}
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-700 text-3xl font-light focus:outline-none transition-all"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            {/* Modal Content */}
            <div className="px-8 py-6">
              {loading ? (
                <div className="text-center py-12 text-gray-600 text-lg">Loading profile details...</div>
              ) : error ? (
                <div className="text-red-500 text-center py-12 text-lg">{error}</div>
              ) : profileDetails ? (
                <div className="space-y-8">
                    <div>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-100">User Profile</h2>
                    <div className="space-y-3">
                      <div><span className="font-semibold">Email:</span> {profileDetails.email || user.email || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Phone:</span> {profileDetails.phone || user.phone || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Gender:</span> {profileDetails.gender || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Age:</span> {profileDetails.age ?? <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">City:</span> {profileDetails.city || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Address:</span> {profileDetails.address?.address || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Latitude:</span> {profileDetails.address?.latitude ?? <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Longitude:</span> {profileDetails.address?.longitude ?? <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Pin Code:</span> {profileDetails.address?.pinCode ?? <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Medical History:</span> {profileDetails.medicalHistory || <span className='text-gray-400'>Not provided</span>}</div>
                    <div>
                        <span className="font-semibold">Medical History PDFs:</span>
                        {profileDetails.medicalHistoryPdfs && profileDetails.medicalHistoryPdfs.length > 0 ? (
                          <ul className="list-disc ml-5 mt-1">
                            {profileDetails.medicalHistoryPdfs.map((pdf, idx) => (
                              <li key={idx}>
                                <a href={pdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">PDF {idx + 1}</a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className='text-gray-400 ml-1'>Not provided</span>
                        )}
                      </div>
                      <div><span className="font-semibold">Created:</span> {profileDetails.createdAt ? new Date(profileDetails.createdAt).toLocaleDateString() : <span className='text-gray-400'>N/A</span>}</div>
                      <div><span className="font-semibold">Updated:</span> {profileDetails.updatedAt ? new Date(profileDetails.updatedAt).toLocaleDateString() : <span className='text-gray-400'>N/A</span>}</div>
                      </div>
                    </div>
                </div>
              ) : (
                <div className="text-red-500 text-center py-12 text-lg">Failed to load profile details.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserCard;
