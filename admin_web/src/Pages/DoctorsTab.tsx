import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import UserCard from '../components/userCard';
import { FaCalendarAlt } from 'react-icons/fa';

interface Doctor {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  specializations?: string[];
  experience?: number;
  consultationType?: string;
  city?: string;
  createdAt?: string;
  updatedAt?: string;
  isVerified: boolean;
  status?: 'verified' | 'not_verified' | 'rejected';
}

interface Appointment {
  _id: string;
  doctor?: { name?: string; _id?: string; email?: string; phone?: string };
  patient?: { name?: string; email?: string; phone?: string };
  clinic?: { 
    clinicName?: string; 
    clinicAddress?: { 
      address?: string;
      latitude?: number;
      longitude?: number;
      pinCode?: string;
      googleMapsLink?: string;
    };
    clinicPhone?: string;
    clinicEmail?: string;
    clinicWebsite?: string;
  };
  timeSlot: string | Date;
  consultationType?: 'in-person' | 'online' | 'both';
  prescription?: string;
  status: 'upcoming' | 'completed';
  isPaid: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DoctorProfile {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  gender?: string;
  age?: number;
  experience?: number;
  specializations?: string[];
  qualifications?: string[];
  consultationFee?: number;
  registrationNumber?: string;
  consultationType?: string;
  availableDays?: string[];
  availableSlots?: string[];
  city?: string;
  address?: {
    address?: string;
  };
  isVerified?: boolean;
  isAvailable?: boolean;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
  profilePicture?: string;
  status?: 'verified' | 'not_verified' | 'rejected';
}

const DoctorsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'appointments'>('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState<DoctorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  
  // Filter states
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [specializationFilter, setSpecializationFilter] = useState<string>('');
  const [experienceFilter, setExperienceFilter] = useState<string>('');
  const [consultationTypeFilter, setConsultationTypeFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'doctors') {
      await fetchDoctors();
    } else {
      if (selectedDoctorId) {
        await fetchDoctorAppointments(selectedDoctorId);
      } else if (showAllAppointments) {
        await fetchAllAppointments();
      }
    }
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
    } catch {
      setError('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async (doctorId: string) => {
    console.log('fetchDoctorAppointments called with doctorId:', doctorId);
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      console.log('Token:', token ? 'Present' : 'Missing');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/doctor-appointments?doctorId=${doctorId}`;
      console.log('API URL:', apiUrl);
      console.log('Fetching doctor appointments for ID:', doctorId);
      const res = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      console.log('Response received:', res.data);
      console.log('Doctor appointments response:', res.data);
      console.log('First appointment doctor data:', res.data.appointments?.[0]?.doctor);
      console.log('First appointment patient data:', res.data.appointments?.[0]?.patient);
      console.log('First appointment clinic data:', res.data.appointments?.[0]?.clinic);
      console.log('All appointments:', res.data.appointments);
      
      // Check if appointments have proper doctor data
      const appointmentsWithDoctorData = res.data.appointments?.filter((apt: Appointment) => apt.doctor && apt.doctor.name);
      console.log('Appointments with doctor data:', appointmentsWithDoctorData?.length);
      
      console.log('Setting appointments state with:', res.data.appointments?.length || 0, 'appointments');
      setAppointments(res.data.appointments || []);
      console.log('Appointments state should now be set');
    } catch (error) {
      console.error('Error in fetchDoctorAppointments:', error);
      if (error && typeof error === 'object' && 'response' in error && 'data' in (error as { response: { data: unknown } }).response) {
        console.error('Error details:', (error as { response: { data: unknown } }).response.data);
      }
      console.error('Error fetching doctor appointments:', error);
      setError('Failed to fetch doctor appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/doctor-appointments';
      const res = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAppointments(res.data.appointments || []);
    } catch {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorCardClick = (doctor: Doctor) => {
    console.log('handleDoctorCardClick called for doctor:', doctor.user.name);
    console.log('Setting selectedDoctorId to:', doctor.user._id);
    setSelectedDoctorId(doctor.user._id);
    setShowAllAppointments(false);
    setActiveTab('appointments');
    fetchDoctorAppointments(doctor.user._id);
  };

  const handleShowAllAppointments = () => {
    setSelectedDoctorId(null);
    setShowAllAppointments(true);
    fetchAllAppointments();
  };

  const handleViewProfile = async (e: React.MouseEvent, doctor: Doctor) => {
    e.stopPropagation(); // Prevent triggering the card click
    setShowProfileModal(true);
    setProfileLoading(true);
    setSelectedDoctorProfile(null);
    
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/data/${doctor._id}?type=doctors`;
      const res = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSelectedDoctorProfile(res.data);
    } catch (error) {
      console.error('Failed to fetch doctor profile:', error);
      setError('Failed to fetch doctor profile');
    } finally {
      setProfileLoading(false);
    }
  };

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

  const handleVerifyDoctor = async (doctorId: string, verify: boolean) => {
    setVerificationLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const endpoint = verify ? 'verify' : 'unverify';
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/profiles/${doctorId}/${endpoint}`;
      
      const res = await axios.put(apiUrl, 
        { type: 'doctors' },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      
      // Update the doctor in the list
      setDoctors(prevDoctors => 
        prevDoctors.map(doctor => 
          doctor._id === doctorId 
            ? { ...doctor, isVerified: res.data.isVerified }
            : doctor
        )
      );
      
      // Update the selected profile if it's the same doctor
      if (selectedDoctorProfile && selectedDoctorProfile._id === doctorId) {
        setSelectedDoctorProfile(res.data);
      }
      
      // Show success message
      alert(verify ? 'Doctor verified successfully!' : 'Doctor verification removed successfully!');
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert('Failed to update verification status');
    } finally {
      setVerificationLoading(false);
    }
  };

  // 1. Update Doctor and DoctorProfile interfaces to include 'status' field
  // 2. Add handler for rejecting a doctor
  const handleRejectDoctor = async (doctorId: string) => {
    setVerificationLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/profiles/${doctorId}/reject`;
      await axios.put(apiUrl, {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setDoctors(prevDoctors => prevDoctors.map(doctor => doctor._id === doctorId ? { ...doctor, isVerified: false, status: 'rejected' } : doctor));
      if (selectedDoctorProfile && selectedDoctorProfile._id === doctorId) {
        setSelectedDoctorProfile({ ...selectedDoctorProfile, isVerified: false, status: 'rejected' });
      }
      alert('Doctor profile rejected successfully!');
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      alert('Failed to reject doctor profile');
    } finally {
      setVerificationLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to top on tab change
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (activeTab === 'doctors') {
      fetchDoctors();
      setSelectedDoctorId(null);
      setShowAllAppointments(false);
      setAppointments([]);
    }
  }, [activeTab]);

  // Debug useEffect to log appointments state changes
  useEffect(() => {
    console.log('Appointments state changed:', appointments.length, 'appointments');
    console.log('Selected doctor ID:', selectedDoctorId);
    console.log('Show all appointments:', showAllAppointments);
  }, [appointments, selectedDoctorId, showAllAppointments]);

  // Get unique values for filter options
  const allSpecializations = Array.from(new Set(
    doctors.flatMap(doctor => doctor.specializations || [])
  )).sort();
  
  const allCities = Array.from(new Set(
    doctors.map(doctor => doctor.city).filter(Boolean)
  )).sort();
  
  const allConsultationTypes = Array.from(new Set(
    doctors.map(doctor => doctor.consultationType).filter(Boolean)
  )).sort();

  const filteredDoctors = doctors.filter((doctor: Doctor) => {
    const name = doctor.user?.name?.toLowerCase() || '';
    const email = doctor.user?.email?.toLowerCase() || '';
    const phone = doctor.user?.phone || '';
    const searchLower = search.toLowerCase();
    
    // Basic search filter
    const matchesSearch = (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(search)
    );
    
    // Verification filter
    const matchesVerification = 
      verificationFilter === 'all' ||
      (verificationFilter === 'verified' && doctor.isVerified) ||
      (verificationFilter === 'unverified' && !doctor.isVerified);
    
    // Specialization filter
    const matchesSpecialization = 
      !specializationFilter ||
      doctor.specializations?.some(spec => 
        spec.toLowerCase().includes(specializationFilter.toLowerCase())
      );
    
    // Experience filter
    const matchesExperience = 
      !experienceFilter ||
      (doctor.experience && doctor.experience >= parseInt(experienceFilter));
    
    // Consultation type filter
    const matchesConsultationType = 
      !consultationTypeFilter ||
      doctor.consultationType?.toLowerCase().includes(consultationTypeFilter.toLowerCase());
    
    // City filter
    const matchesCity = 
      !cityFilter ||
      doctor.city?.toLowerCase().includes(cityFilter.toLowerCase());
    
    return matchesSearch && matchesVerification && matchesSpecialization && 
           matchesExperience && matchesConsultationType && matchesCity;
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
      <div className="mb-8 flex gap-4 bg-card rounded-xl shadow p-2 w-fit">
        <button
          className={`px-6 py-3 rounded-xl font-semibold text-lg transition-colors ${activeTab === 'doctors' ? 'bg-primary text-white shadow' : 'bg-muted text-icon hover:bg-primary hover:text-white'}`}
          onClick={() => setActiveTab('doctors')}
        >
          Doctors
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-semibold text-lg transition-colors ${activeTab === 'appointments' ? 'bg-primary text-white shadow' : 'bg-muted text-icon hover:bg-primary hover:text-white'}`}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>
      </div>
      {activeTab === 'doctors' && (
        <div className="bg-card rounded-xl shadow p-8">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold">Doctors</h1>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search by name, email, or phone"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border rounded-lg px-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center gap-3 shadow-lg border-0 transform hover:scale-105 active:scale-95"              >
                <span>Filters</span>
                <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
              </button>
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Filter Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Verification Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value as 'all' | 'verified' | 'unverified')}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Doctors</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified Only</option>
                  </select>
                </div>
                
                {/* Specialization Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <select
                    value={specializationFilter}
                    onChange={(e) => setSpecializationFilter(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Specializations</option>
                    {allSpecializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                
                {/* Experience Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Experience (years)</label>
                  <select
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Any Experience</option>
                    <option value="1">1+ years</option>
                    <option value="3">3+ years</option>
                    <option value="5">5+ years</option>
                    <option value="10">10+ years</option>
                    <option value="15">15+ years</option>
                  </select>
                </div>
                
                {/* Consultation Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Type</label>
                  <select
                    value={consultationTypeFilter}
                    onChange={(e) => setConsultationTypeFilter(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Types</option>
                    {allConsultationTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                {/* City Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Cities</option>
                    {allCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setVerificationFilter('all');
                      setSpecializationFilter('');
                      setExperienceFilter('');
                      setConsultationTypeFilter('');
                      setCityFilter('');
                    }}
                    className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
              
              {/* Results Count */}
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredDoctors.length} of {doctors.length} doctors
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-8">
            {filteredDoctors.length > 0 ? filteredDoctors.map((doctor: Doctor) => (
              <div key={doctor._id} className="relative animate-fade-in">
                <div className="flex flex-row items-center gap-4">
                  <div style={{ flex: 1 }} onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleViewProfile(e, doctor)}>
                  <UserCard user={{
                    _id: doctor.user?._id || '',
                    name: doctor.user?.name || '',
                    email: doctor.user?.email || '',
                    phone: doctor.user?.phone || '',
                    role: 'doctor',
                    isPhoneEmailVerified: true,
                    profile: doctor._id,
                    isVerified: doctor.isVerified,
                    createdAt: doctor.createdAt ? new Date(doctor.createdAt) : undefined,
                    updatedAt: doctor.updatedAt ? new Date(doctor.updatedAt) : undefined,
                    }} disableModal={true} />
                </div>
                  <button
                    onClick={() => handleDoctorCardClick(doctor)}
                    className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl text-base font-semibold shadow-lg hover:from-green-500 hover:to-blue-600 hover:scale-105 transition-all flex items-center gap-2 ml-2"
                    style={{ minWidth: 180 }}
                  >
                    <FaCalendarAlt className="text-lg" />
                    Show Appointments
                  </button>
                </div>
              </div>
            )) : <div className="text-center col-span-3 text-icon">No doctors found.</div>}
          </div>
        </div>
      )}
      {activeTab === 'appointments' && (
        <div className="bg-card rounded-xl shadow p-8">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold">Doctor Appointments</h1>
            <button
              onClick={handleShowAllAppointments}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Show All Appointments
            </button>
          </div>
          {selectedDoctorId && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                Showing appointments for: <strong>{appointments[0]?.doctor?.name || 'Selected Doctor'}</strong>
              </p>
            </div>
          )}
          {showAllAppointments && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                <strong>Showing all doctor appointments</strong>
              </p>
            </div>
          )}
          {!selectedDoctorId && !showAllAppointments && !loading && (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-4">Click on a doctor card to view their appointments</p>
              <p className="text-sm text-gray-500">Or click "Show All Appointments" to view all doctor appointments</p>
            </div>
          )}
          {(selectedDoctorId || showAllAppointments || loading) && (
            <div className="transition-opacity duration-300" style={{ opacity: loading ? 0.5 : 1 }}>
              {loading ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <span className="text-gray-500 text-lg">Loading appointments...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-8">{error}</div>
              ) : appointments.length === 0 ? (
                <div className="text-center text-icon">No appointments found.</div>
              ) : (
                <div className="overflow-x-auto max-w-full">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-w-max">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">👨‍⚕️</span>
                              Doctor
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">👤</span>
                              Patient
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-orange-600">🏥</span>
                              Clinic
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-600">🕐</span>
                              Time Slot
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-orange-600">💻</span>
                              Type
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">💰</span>
                              Payment
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">📋</span>
                              Status
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-600">📝</span>
                              Notes
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">📅</span>
                              Created
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100 transition-all duration-300">
                        {appointments.map((appt: Appointment, index: number) => (
                          <tr 
                            key={appt._id} 
                            className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap min-w-[200px]">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3 flex-shrink-0">
                                  {appt.doctor?.name?.charAt(0)?.toUpperCase() || 'D'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {appt.doctor?.name || 'Unknown Doctor'}
                                    {!appt.doctor?.name && <span className="text-red-500 text-xs ml-2">(No name)</span>}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {appt.doctor?.email || 'No email'}
                                    {!appt.doctor?.email && <span className="text-red-500 text-xs ml-1">(No email)</span>}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Doctor ID: {appt.doctor?._id || 'No ID'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[200px]">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3 flex-shrink-0">
                                  {appt.patient?.name?.charAt(0)?.toUpperCase() || 'P'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate">{appt.patient?.name || '-'}</div>
                                  <div className="text-xs text-gray-500 truncate">{appt.patient?.email || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[200px]">
                              <div className="text-sm text-gray-900 font-medium truncate">{appt.clinic?.clinicName || 'No Clinic'}</div>
                              {appt.clinic?.clinicAddress?.address && (
                                <div className="text-xs text-gray-500 truncate">{appt.clinic.clinicAddress.address}</div>
                              )}
                              {appt.clinic?.clinicPhone && (
                                <div className="text-xs text-gray-400 truncate">📞 {appt.clinic.clinicPhone}</div>
                              )}
                              {appt.clinic?.clinicEmail && (
                                <div className="text-xs text-gray-400 truncate">📧 {appt.clinic.clinicEmail}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                              <div className="text-sm text-gray-900 font-medium">
                                {typeof appt.timeSlot === 'string' 
                                  ? appt.timeSlot 
                                  : new Date(appt.timeSlot).toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                }
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[140px]">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                appt.consultationType === 'online' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : appt.consultationType === 'in-person'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {appt.consultationType === 'online' ? '🌐 Online' : 
                                 appt.consultationType === 'in-person' ? '🏥 In-Person' : 
                                 appt.consultationType || '📋 Not Specified'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[100px]">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                appt.isPaid 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {appt.isPaid ? '✅ Paid' : '❌ Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                appt.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {appt.status === 'completed' ? '✅ Completed' : '⏳ Upcoming'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[150px]">
                              <div className="text-sm text-gray-900 truncate">
                                {appt.prescription || appt.notes || 'No notes'}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                              {(() => {
                                if (!appt.createdAt) return 'N/A';
                                const d = new Date(appt.createdAt);
                                if (isNaN(d.getTime())) return 'N/A';
                                return d.toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                                });
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden">
                  {selectedDoctorProfile?.profilePicture ? (
                    <img src={selectedDoctorProfile.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    selectedDoctorProfile?.user?.name?.charAt(0).toUpperCase() || 'D'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-gray-900">{selectedDoctorProfile?.user?.name || 'Doctor'}</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">Doctor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${selectedDoctorProfile?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}> 
                      <span className="text-sm">{selectedDoctorProfile?.isVerified ? '\u2705' : '\u23f3'}</span>
                      <span className="text-sm font-medium">{selectedDoctorProfile?.isVerified ? 'Verified' : 'Pending Verification'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-700 text-3xl font-light focus:outline-none transition-all"
                onClick={() => setShowProfileModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            {/* Modal Content */}
            <div className="px-8 py-6">
              {profileLoading ? (
                <div className="text-center py-12 text-gray-600 text-lg">Loading profile details...</div>
              ) : selectedDoctorProfile ? (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-100">Doctor Profile</h2>
                    <div className="space-y-3">
                      <div><span className="font-semibold">Email:</span> {selectedDoctorProfile.user?.email || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Phone:</span> {selectedDoctorProfile.user?.phone || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Gender:</span> {selectedDoctorProfile.gender || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Age:</span> {selectedDoctorProfile.age ?? <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Experience:</span> {selectedDoctorProfile.experience ?? <span className='text-gray-400'>Not provided</span>} years</div>
                      <div><span className="font-semibold">Specializations:</span> {selectedDoctorProfile.specializations && selectedDoctorProfile.specializations.length > 0 ? selectedDoctorProfile.specializations.join(', ') : <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Qualifications:</span> {selectedDoctorProfile.qualifications && selectedDoctorProfile.qualifications.length > 0 ? selectedDoctorProfile.qualifications.join(', ') : <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Consultation Fee:</span> {selectedDoctorProfile.consultationFee ?? <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Registration Number:</span> {selectedDoctorProfile.registrationNumber || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Consultation Type:</span> {selectedDoctorProfile.consultationType || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Available Days:</span> {selectedDoctorProfile.availableDays && selectedDoctorProfile.availableDays.length > 0 ? selectedDoctorProfile.availableDays.join(', ') : <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Available Slots:</span> {selectedDoctorProfile.availableSlots && selectedDoctorProfile.availableSlots.length > 0 ? selectedDoctorProfile.availableSlots.join(', ') : <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">City:</span> {selectedDoctorProfile.city || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Address:</span> {selectedDoctorProfile.address?.address || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Available:</span> {selectedDoctorProfile.isAvailable ? 'Yes' : 'No'}</div>
                      <div><span className="font-semibold">Rating:</span> {selectedDoctorProfile.rating ?? <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Created:</span> {selectedDoctorProfile.createdAt ? formatDate(selectedDoctorProfile.createdAt) : <span className='text-gray-400'>N/A</span>}</div>
                      <div><span className="font-semibold">Updated:</span> {selectedDoctorProfile.updatedAt ? formatDate(selectedDoctorProfile.updatedAt) : <span className='text-gray-400'>N/A</span>}</div>
                    </div>
                  </div>
                  
                  {/* Verification Controls */}
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Verification Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="verification"
                            checked={selectedDoctorProfile.status === 'verified'}
                            onChange={() => handleVerifyDoctor(selectedDoctorProfile._id, true)}
                            disabled={verificationLoading}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Verified</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="verification"
                            checked={selectedDoctorProfile.status === 'not_verified'}
                            onChange={() => handleVerifyDoctor(selectedDoctorProfile._id, false)}
                            disabled={verificationLoading}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Not Verified</span>
                        </label>
                        <button
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${selectedDoctorProfile.status === 'rejected' ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-red-600 text-white hover:bg-red-700'}`}
                          onClick={() => {
                            if (selectedDoctorProfile.status === 'rejected') {
                              // Undo reject: set to not_verified
                              handleVerifyDoctor(selectedDoctorProfile._id, false);
                            } else {
                              handleRejectDoctor(selectedDoctorProfile._id);
                            }
                          }}
                          disabled={verificationLoading}
                          style={{ minWidth: 120 }}
                        >
                          {selectedDoctorProfile.status === 'rejected' ? 'Undo Reject' : 'Reject'}
                        </button>
                      </div>
                      {selectedDoctorProfile.status === 'rejected' && (
                        <div className="text-red-700 font-semibold mt-2">This doctor profile has been rejected and will not be shown to users. You can undo rejection by setting the status to Verified or Not Verified.</div>
                      )}
                      {verificationLoading && (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Updating verification status...</span>
                        </div>
                      )}
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
    </div>
  );
};

export default DoctorsTab; 