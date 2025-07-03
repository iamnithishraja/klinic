import React, { useState } from 'react';
import axios from 'axios';
import { FaEnvelope, FaPhone } from 'react-icons/fa';

interface Address {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  pinCode?: string | null;
  googleMapsLink?: string | null;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user' | 'doctor' | 'laboratory' | 'deliverypartner';
  isPhoneEmailVerified: boolean;
  profile?: string; // profile ObjectId for non-user roles
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface UserProfile {
  gender?: string;
  age?: number;
  address?: Address;
  city?: string;
  profilePicture?: string;
  medicalHistory?: string;
  medicalHistoryPdfs?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface DoctorProfile extends UserProfile {
  coverImage?: string;
  description?: string;
  experience?: number;
  specializations?: string[];
  qualifications?: string[];
  consultationFee?: number;
  registrationNumber?: string;
  isVerified?: boolean;
  consultationType?: string;
  availableSlots?: string[];
  availableDays?: string[];
  isAvailable?: boolean;
  rating?: number;
}

interface LaboratoryProfile {
  laboratoryName?: string;
  laboratoryPhone?: string;
  laboratoryEmail?: string;
  laboratoryWebsite?: string;
  laboratoryAddress?: Address;
  coverImage?: string;
  city?: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  availableDays?: string[];
  availableSlots?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface DeliveryBoyProfile {
  gender?: string;
  age?: number;
  address?: Address;
  city?: string;
  profilePicture?: string;
  isVerified?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

type ProfileDetails = UserProfile | DoctorProfile | LaboratoryProfile | DeliveryBoyProfile | null;

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [profileDetails, setProfileDetails] = useState<ProfileDetails>(null);
  const [loading, setLoading] = useState(false);

  const handleCardClick = async () => {
    setShowModal(true);
    setLoading(true);
    setProfileDetails(null);
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
      // eslint-disable-next-line no-console
      console.error('Failed to fetch profile details:', error);
      setProfileDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const renderVerificationStatus = () => {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
        user.isPhoneEmailVerified 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        <span className="text-sm">
          {user.isPhoneEmailVerified ? '✅' : '⏳'}
        </span>
        <span className="text-sm font-medium">
          {user.isPhoneEmailVerified ? 'Verified' : 'Pending Verification'}
        </span>
      </div>
    );
  };

  const renderRoleBadge = () => {
    const role = user.role || 'user';
    let badgeColor = 'bg-gray-100 text-gray-800';
    if (role === 'admin') badgeColor = 'bg-red-100 text-red-800';
    else if (role === 'doctor') badgeColor = 'bg-blue-100 text-blue-800';
    else if (role === 'laboratory') badgeColor = 'bg-green-100 text-green-800';
    else if (role === 'deliverypartner') badgeColor = 'bg-orange-100 text-orange-800';
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeColor} capitalize`}>
        {role}
      </span>
    );
  };

  // Helper for displaying missing/null/undefined fields
  const displayField = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span style={{ color: '#888', fontStyle: 'italic' }}>Not provided</span>;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : <span style={{ color: '#888', fontStyle: 'italic' }}>Not provided</span>;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return value as React.ReactNode;
  };

  // Helper to safely parse date
  const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return 'N/A';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <>
      <div
        className="bg-background border border-icon rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
        onClick={handleCardClick}
        style={{ color: 'var(--color-text)', background: 'var(--color-background)' }}
      >
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-tint to-tint/80 rounded-full flex items-center justify-center text-background font-bold text-xl shadow-lg">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-text mb-1">{user.name || 'Unknown User'}</h3>
            <div className="flex items-center gap-3">
              {renderRoleBadge()}
              {renderVerificationStatus()}
            </div>
          </div>
        </div>

        {/* Enhanced Information Grid */}
        <div className="flex flex-col md:flex-row gap-10 mb-4">
          <div className="bg-background/50 border border-icon/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaEnvelope className="text-lg" />
              <span className="text-xs text-icon font-medium">Email</span>
            </div>
            <p className="text-sm text-text font-medium truncate">{user.email || 'N/A'}</p>
          </div>
          
          <div className="bg-background/50 border border-icon/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaPhone className="text-lg" />
              <span className="text-xs text-icon font-medium">Phone</span>
            </div>
            <p className="text-sm text-text font-medium">{user.phone || 'N/A'}</p>
          </div>
        </div>

        {/* Location and Additional Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-icon">
            <span>Member since: {formatDate(user.createdAt)}</span>
            <span>Last updated: {formatDate(user.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tint to-blue-400 flex items-center justify-center text-white text-3xl font-bold shadow">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-gray-900">{user.name || 'Unknown User'}</span>
                    {renderRoleBadge()}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderVerificationStatus()}
                  </div>
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
                <div className="text-center py-12 text-icon text-lg">Loading...</div>
              ) : profileDetails ? (
                <div className="space-y-8">
                  {/* Render profile details based on user role */}
                  {user.role === 'doctor' && profileDetails && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-100">Doctor Profile</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>Email: {displayField(user.email)}</div>
                        <div>Phone: {displayField(user.phone)}</div>
                        <div>Gender: {displayField((profileDetails as DoctorProfile).gender)}</div>
                        <div>Age: {displayField((profileDetails as DoctorProfile).age)}</div>
                        <div>Experience: {displayField((profileDetails as DoctorProfile).experience)} years</div>
                        <div>Specializations: {displayField((profileDetails as DoctorProfile).specializations)}</div>
                        <div>Qualifications: {displayField((profileDetails as DoctorProfile).qualifications)}</div>
                        <div>Consultation Fee: {displayField((profileDetails as DoctorProfile).consultationFee)}</div>
                        <div>Registration Number: {displayField((profileDetails as DoctorProfile).registrationNumber)}</div>
                        <div>Consultation Type: {displayField((profileDetails as DoctorProfile).consultationType)}</div>
                        <div>Available Days: {displayField((profileDetails as DoctorProfile).availableDays)}</div>
                        <div>Available Slots: {displayField((profileDetails as DoctorProfile).availableSlots)}</div>
                        <div>City: {displayField((profileDetails as DoctorProfile).city)}</div>
                        <div>Address: {displayField((profileDetails as DoctorProfile).address?.address)}</div>
                        <div>Verified: {displayField((profileDetails as DoctorProfile).isVerified)}</div>
                        <div>Available: {displayField((profileDetails as DoctorProfile).isAvailable)}</div>
                        <div>Rating: {displayField((profileDetails as DoctorProfile).rating)}</div>
                        <div>Created: {displayField(formatDate((profileDetails as DoctorProfile).createdAt))}</div>
                        <div>Updated: {displayField(formatDate((profileDetails as DoctorProfile).updatedAt))}</div>
                      </div>
                    </div>
                  )}
                  {user.role === 'laboratory' && profileDetails && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-100">Laboratory Profile</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>Lab Name: {displayField((profileDetails as LaboratoryProfile).laboratoryName)}</div>
                        <div>Email: {displayField((profileDetails as LaboratoryProfile).laboratoryEmail || user.email)}</div>
                        <div>Phone: {displayField((profileDetails as LaboratoryProfile).laboratoryPhone || user.phone)}</div>
                        <div>Website: {displayField((profileDetails as LaboratoryProfile).laboratoryWebsite)}</div>
                        <div>Address: {displayField((profileDetails as LaboratoryProfile).laboratoryAddress?.address)}</div>
                        <div>City: {displayField((profileDetails as LaboratoryProfile).city)}</div>
                        <div>Available Days: {displayField((profileDetails as LaboratoryProfile).availableDays)}</div>
                        <div>Available Slots: {displayField((profileDetails as LaboratoryProfile).availableSlots)}</div>
                        <div>Verified: {displayField((profileDetails as LaboratoryProfile).isVerified)}</div>
                        <div>Available: {displayField((profileDetails as LaboratoryProfile).isAvailable)}</div>
                        <div>Created: {displayField(formatDate((profileDetails as LaboratoryProfile).createdAt))}</div>
                        <div>Updated: {displayField(formatDate((profileDetails as LaboratoryProfile).updatedAt))}</div>
                      </div>
                    </div>
                  )}
                  {user.role === 'deliverypartner' && profileDetails && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-100">Delivery Partner Profile</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>Name: {displayField(user.name)}</div>
                        <div>Email: {displayField(user.email)}</div>
                        <div>Phone: {displayField(user.phone)}</div>
                        <div>Gender: {displayField((profileDetails as DeliveryBoyProfile).gender)}</div>
                        <div>Age: {displayField((profileDetails as DeliveryBoyProfile).age)}</div>
                        <div>Address: {displayField((profileDetails as DeliveryBoyProfile).address?.address)}</div>
                        <div>City: {displayField((profileDetails as DeliveryBoyProfile).city)}</div>
                        <div>Verified: {displayField((profileDetails as DeliveryBoyProfile).isVerified)}</div>
                        <div>Created: {displayField(formatDate((profileDetails as DeliveryBoyProfile).createdAt))}</div>
                        <div>Updated: {displayField(formatDate((profileDetails as DeliveryBoyProfile).updatedAt))}</div>
                      </div>
                    </div>
                  )}
                  {user.role === 'user' && profileDetails && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-100 flex items-center gap-2">
                        <span role="img" aria-label="user">👤</span> User Profile
                      </h2>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><span role="img" aria-label="personal">📝</span> Personal Info</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>Name: {displayField(user.name)}</div>
                          <div>Gender: {displayField((profileDetails as UserProfile).gender)}</div>
                          <div>Age: {displayField((profileDetails as UserProfile).age)}</div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><span role="img" aria-label="contact">📞</span> Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>Email: {displayField(user.email)}</div>
                          <div>Phone: {displayField(user.phone)}</div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><span role="img" aria-label="address">🏠</span> Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>Address: {displayField((profileDetails as UserProfile).address?.address)}</div>
                          <div>City: {displayField((profileDetails as UserProfile).city)}</div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><span role="img" aria-label="medical">🩺</span> Medical</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>Medical History: {displayField((profileDetails as UserProfile).medicalHistory)}</div>
                          {(profileDetails as UserProfile).medicalHistoryPdfs && Array.isArray((profileDetails as UserProfile).medicalHistoryPdfs) && (profileDetails as UserProfile).medicalHistoryPdfs.length > 0 && (
                            <div>
                              Medical History PDFs:&nbsp;
                              {(profileDetails as UserProfile).medicalHistoryPdfs.map((pdfLocation: string, idx: number) => {
                                // Assume pdfLocation is a file path or identifier in the DB, and we have an API endpoint to download by location
                                // e.g., /api/files/download?location=...
                                const downloadUrl = `/api/files/download?location=${encodeURIComponent(pdfLocation)}`;
                                return (
                                  <a
                                    key={idx}
                                    href={downloadUrl}
                                    download={`medical-history-${idx + 1}.pdf`}
                                    className="text-tint underline hover:text-blue-700 mr-2"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    type="application/pdf"
                                  >
                                    Download PDF {idx + 1}
                                  </a>
                                );
                              
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><span role="img" aria-label="meta">⏰</span> Meta</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>Created: {displayField(formatDate((profileDetails as UserProfile).createdAt))}</div>
                          <div>Updated: {displayField(formatDate((profileDetails as UserProfile).updatedAt))}</div>
                        </div>
                      </div>
                    </div>
                  )}
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
