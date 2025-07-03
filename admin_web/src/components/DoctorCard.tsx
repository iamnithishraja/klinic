import React, { useState } from 'react';
import axios from 'axios';
import { FaUserMd, FaMoneyBill, FaStar, FaMapMarkerAlt, FaHospital, FaEnvelope } from 'react-icons/fa';

// DoctorAddress interface removed as it's not used in the current profile structure

interface DoctorProfile {
  _id?: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  profilePicture?: string;
  coverImage?: string;
  specializations?: string[];
  experience?: number;
  qualifications?: string[];
  registrationNumber?: string;
  consultationFee?: number;
  consultationType?: 'in-person' | 'online' | 'both';
  city?: string;
  gender?: string;
  description?: string;
  rating?: number;
  isVerified?: boolean;
  clinics?: Array<{
    clinicName: string;
    address: string;
  }>;
  updatedAt?: Date;
  createdAt?: Date;
}

interface DoctorCardProps {
  doctor: DoctorProfile;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const [showModal, setShowModal] = useState(false);
  const [fullDetails, setFullDetails] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCardClick = async () => {
    setShowModal(true);
    setLoading(true);
    try {
      // Fetch full doctor details using the unified API
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/data/${doctor._id}`;
      const token = localStorage.getItem('admin_token');
      const res = await axios.get<DoctorProfile>(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { type: 'doctors' }
      });
      setFullDetails(res.data);
    } catch (error) {
      console.error('Failed to fetch doctor details:', error);
      setFullDetails(null);
    } finally {
      setLoading(false);
    }
  };



  const renderVerificationStatus = () => {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
        doctor.isVerified 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        <span className="text-sm">
          {doctor.isVerified ? '✅' : '⏳'}
        </span>
        <span className="text-sm font-medium">
          {doctor.isVerified ? 'Verified' : 'Pending Verification'}
        </span>
      </div>
    );
  };

  const renderSpecializationBadge = () => {
    const specializations = doctor.specializations || ['General Medicine'];
    const primarySpec = specializations[0];
    let badgeColor = 'bg-blue-100 text-blue-800';
    if (primarySpec.toLowerCase().includes('cardiology')) badgeColor = 'bg-red-100 text-red-800';
    else if (primarySpec.toLowerCase().includes('neurology')) badgeColor = 'bg-purple-100 text-purple-800';
    else if (primarySpec.toLowerCase().includes('orthopedic')) badgeColor = 'bg-orange-100 text-orange-800';
    else if (primarySpec.toLowerCase().includes('pediatric')) badgeColor = 'bg-pink-100 text-pink-800';
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeColor} capitalize`}>
        {primarySpec}
      </span>
    );
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
            {doctor.user?.name?.charAt(0).toUpperCase() || 'D'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-text mb-1">Dr. {doctor.user?.name || 'Unknown Doctor'}</h3>
            <div className="flex items-center gap-3">
              {renderSpecializationBadge()}
              {renderVerificationStatus()}
            </div>
          </div>
        </div>

        {/* Enhanced Information Grid */}
        <div className="flex flex-col-5 gap-10 mb-4">
          <div className="bg-background/50 border border-icon/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaUserMd className="text-lg" />
              <span className="text-xs text-icon font-medium">Experience</span>
            </div>
            <p className="text-sm text-text font-medium">{doctor.experience || 0} years</p>
          </div>
          
          <div className="bg-background/50 border border-icon/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaMoneyBill className="text-lg" />
              <span className="text-xs text-icon font-medium">Fee</span>
            </div>
            <p className="text-sm text-text font-medium">₹{doctor.consultationFee || 0}</p>
          </div>
          
          <div className="bg-background/50 border border-icon/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaStar className="text-lg" />
              <span className="text-xs text-icon font-medium">Rating</span>
            </div>
            <p className="text-sm text-text font-medium">{doctor.rating || 0}/5</p>
          </div>
          
          <div className="bg-background/50 border border-icon/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaMapMarkerAlt className="text-lg" />
              <span className="text-xs text-icon font-medium">Location</span>
            </div>
            <p className="text-sm text-text font-medium">{doctor.city || 'Location not specified'}</p>
          </div>
          
          <div className="bg-background/50 border border-icon/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaHospital className="text-lg" />
              <span className="text-xs text-icon font-medium">License</span>
            </div>
            <p className="text-sm text-text font-medium">{doctor.registrationNumber || 'N/A'}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <div className="bg-background/50 border border-icon/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaEnvelope className="text-lg" />
              <span className="text-xs text-icon font-medium">Contact</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-text">{doctor.user?.email || 'N/A'}</span>
              <span className="text-text">{doctor.user?.phone || 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-icon">
            <span>Registered: {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A'}</span>
            <span>Updated: {doctor.updatedAt ? new Date(doctor.updatedAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative" style={{ color: 'var(--color-text)', background: 'var(--color-background)' }}>
            <button
              className="absolute top-4 right-4 text-icon hover:text-text text-2xl"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            
            {loading ? (
              <div className="text-center py-8 text-icon">Loading...</div>
            ) : fullDetails ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center border-b border-icon pb-8 bg-gradient-to-b from-tint/5 to-transparent rounded-lg p-6 mb-6">
                  <div className="w-28 h-28 bg-gradient-to-br from-tint to-tint/80 rounded-full flex items-center justify-center text-background font-bold text-4xl mx-auto mb-6 shadow-lg">
                    {fullDetails.user?.name?.charAt(0).toUpperCase() || 'D'}
                  </div>
                  <h2 className="text-3xl font-bold text-text mb-3">Dr. {fullDetails.user?.name || 'Unknown Doctor'}</h2>
                  <p className="text-icon text-lg mb-4">{fullDetails.specializations?.join(', ')}</p>
                  
                  {/* Enhanced Professional Info Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-background border border-icon/20 rounded-lg p-3 shadow-sm">
                      <div className="text-2xl mb-1">💰</div>
                      <div className="text-sm text-icon">Consultation Fee</div>
                      <div className="text-lg font-bold text-text">₹{fullDetails.consultationFee || 0}</div>
                    </div>
                    <div className="bg-background border border-icon/20 rounded-lg p-3 shadow-sm">
                      <div className="text-2xl mb-1">⭐</div>
                      <div className="text-sm text-icon">Rating</div>
                      <div className="text-lg font-bold text-text">{fullDetails.rating || 0}/5</div>
                    </div>
                    <div className="bg-background border border-icon/20 rounded-lg p-3 shadow-sm">
                      <div className="text-2xl mb-1">👨‍⚕️</div>
                      <div className="text-sm text-icon">Experience</div>
                      <div className="text-lg font-bold text-text">{fullDetails.experience || 0} years</div>
                    </div>
                    <div className="bg-background border border-icon/20 rounded-lg p-3 shadow-sm">
                      <div className="text-2xl mb-1">🏥</div>
                      <div className="text-sm text-icon">License</div>
                      <div className="text-lg font-bold text-text">{fullDetails.registrationNumber || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Qualifications Display */}
                  {fullDetails.qualifications && fullDetails.qualifications.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-text mb-3">Qualifications</h4>
                      <div className="flex flex-wrap justify-center gap-2">
                        {fullDetails.qualifications.map((qual, index) => (
                          <span key={index} className="bg-tint/10 text-tint px-4 py-2 rounded-full text-sm font-medium border border-tint/20">
                            🎓 {qual}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verification Status with Enhanced Styling */}
                  <div className="flex justify-center">
                    <span className={`px-6 py-3 rounded-full text-base font-semibold shadow-md transition-all duration-300 ${
                      fullDetails.isVerified 
                        ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700' 
                        : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white hover:from-yellow-500 hover:to-yellow-700'
                    }`}>
                      {fullDetails.isVerified ? '✅ Verified Professional' : '⏳ Pending Verification'}
                    </span>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-text border-b border-icon pb-2">Personal Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-icon">Full Name:</span>
                        <span className="text-text">Dr. {fullDetails.user?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-icon">Email:</span>
                        <span className="text-text">{fullDetails.user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-icon">Phone:</span>
                        <span className="text-text">{fullDetails.user?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-icon">Gender:</span>
                        <span className="text-text capitalize">{fullDetails.gender || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-icon">City:</span>
                        <span className="text-text">{fullDetails.city || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-text border-b border-icon pb-2">Professional Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-icon">Experience:</span>
                        <span className="text-text">{fullDetails.experience || 0} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-icon">Consultation Fee:</span>
                        <span className="text-text font-bold">₹{fullDetails.consultationFee || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-icon">License Number:</span>
                        <span className="text-text">{fullDetails.registrationNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-icon">Rating:</span>
                        <span className="text-text">⭐ {fullDetails.rating || 0}/5</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                {fullDetails.specializations && fullDetails.specializations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-text border-b border-icon pb-2">Specializations</h3>
                    <div className="bg-background border border-icon rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {fullDetails.specializations.map((spec, index) => (
                          <span key={index} className="bg-tint/10 text-tint px-3 py-1 rounded-full text-sm font-medium border border-tint/20">
                            🏥 {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Qualifications */}
                {fullDetails.qualifications && fullDetails.qualifications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-text border-b border-icon pb-2">Qualifications</h3>
                    <div className="bg-background border border-icon rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {fullDetails.qualifications.map((qual, index) => (
                          <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                            🎓 {qual}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {fullDetails.description && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-text border-b border-icon pb-2">Description</h3>
                    <div className="bg-background border border-icon rounded-lg p-4">
                      <p className="text-text leading-relaxed">{fullDetails.description}</p>
                    </div>
                  </div>
                )}

                {/* Consultation Type */}
                {fullDetails.consultationType && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-text border-b border-icon pb-2">Consultation Type</h3>
                    <div className="flex gap-2">
                      {fullDetails.consultationType === 'both' ? (
                        <>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">🏥 In-person</span>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">📹 Online</span>
                        </>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          fullDetails.consultationType === 'in-person' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {fullDetails.consultationType === 'in-person' ? '🏥 In-person' : '📹 Online'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Clinics */}
                {fullDetails.clinics && fullDetails.clinics.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-text border-b border-icon pb-2">Clinics</h3>
                    <div className="space-y-3">
                      {fullDetails.clinics.map((clinic, index) => (
                        <div key={index} className="bg-background border border-icon rounded-lg p-4">
                          <h4 className="font-medium text-text mb-2">{clinic.clinicName}</h4>
                          <p className="text-icon text-sm">{clinic.address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-icon">
                  <div className="space-y-2">
                    <span className="font-medium text-icon">Doctor ID:</span>
                    <p className="text-text font-mono text-sm">{fullDetails._id || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="font-medium text-icon">User ID:</span>
                    <p className="text-text font-mono text-sm">{fullDetails.user?._id || 'N/A'}</p>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-icon">
                  <div className="space-y-2">
                    <span className="font-medium text-icon">Created:</span>
                    <p className="text-text">
                      {fullDetails.createdAt ? new Date(fullDetails.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="font-medium text-icon">Last Updated:</span>
                    <p className="text-text">
                      {fullDetails.updatedAt ? new Date(fullDetails.updatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-red-500 text-center py-8">Failed to load doctor details.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorCard; 