import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import UserCard from '../components/userCard';
import { FaCalendarAlt } from 'react-icons/fa';

interface Laboratory {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  city?: string;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isVerified: boolean;
}

interface Appointment {
  _id: string;
  lab?: { name?: string; _id?: string; email?: string; phone?: string };
  patient?: { name?: string; email?: string; phone?: string };
  laboratoryService?: { 
    name?: string; 
    description?: string; 
    price?: number;
    category?: string;
    collectionType?: 'home' | 'lab' | 'both';
    tests?: Array<{
      name: string;
      description?: string;
      price?: number;
    }>;
  };
  selectedTests?: number[];
  timeSlot: string | Date;
  collectionType?: 'lab' | 'home';
  status: 'upcoming' | 'collected' | 'completed';
  isPaid: boolean;
  paymentId?: string;
  paymentOrderId?: string;
  paymentStatus?: 'pending' | 'captured' | 'failed';
  reportResult?: string;
  createdAt: string;
  updatedAt: string;
}

interface LaboratoryProfile {
  _id: string;
  user?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  laboratoryName?: string;
  laboratoryPhone?: string;
  laboratoryEmail?: string;
  laboratoryWebsite?: string;
  laboratoryAddress?: {
    address?: string;
  };
  city?: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  availableDays?: string[];
  availableSlots?: string[];
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

const LaboratoriesTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'laboratories' | 'appointments'>('laboratories');
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedLabProfile, setSelectedLabProfile] = useState<LaboratoryProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  
  // Filter states
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [availableFilter, setAvailableFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'laboratories') {
      await fetchLaboratories();
    } else {
      if (selectedLabId) {
        await fetchLabAppointments(selectedLabId);
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

  const fetchLabAppointments = async (labId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/lab-appointments?labId=${labId}`;
      console.log('Fetching lab appointments for ID:', labId);
      const res = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      console.log('Lab appointments response:', res.data);
      console.log('First appointment lab data:', res.data.appointments?.[0]?.lab);
      console.log('First appointment patient data:', res.data.appointments?.[0]?.patient);
      console.log('First appointment service data:', res.data.appointments?.[0]?.laboratoryService);
      console.log('All appointments:', res.data.appointments);
      
      // Check if appointments have proper lab data
      const appointmentsWithLabData = res.data.appointments?.filter((apt: Appointment) => apt.lab && apt.lab.name);
      console.log('Appointments with lab data:', appointmentsWithLabData?.length);
      
      setAppointments(res.data.appointments || []);
    } catch (error) {
      console.error('Error fetching lab appointments:', error);
      setError('Failed to fetch lab appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/lab-appointments';
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

  const handleLabCardClick = (lab: Laboratory) => {
    console.log('handleLabCardClick called for lab:', lab.user.name);
    console.log('Setting selectedLabId to:', lab.user._id);
    setSelectedLabId(lab.user._id);
    setShowAllAppointments(false);
    setActiveTab('appointments');
    fetchLabAppointments(lab.user._id);
  };

  const handleShowAllAppointments = () => {
    setSelectedLabId(null);
    setShowAllAppointments(true);
    fetchAllAppointments();
  };

  const handleViewProfile = async (e: React.MouseEvent, lab: Laboratory) => {
    e.stopPropagation(); // Prevent triggering the card click
    setShowProfileModal(true);
    setProfileLoading(true);
    setSelectedLabProfile(null);
    
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/data/${lab._id}?type=laboratories`;
      const res = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSelectedLabProfile(res.data);
    } catch (error) {
      console.error('Failed to fetch lab profile:', error);
      setError('Failed to fetch lab profile');
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

  const handleVerifyLab = async (labId: string, verify: boolean) => {
    setVerificationLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const endpoint = verify ? 'verify' : 'unverify';
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/profiles/${labId}/${endpoint}`;
      
      const res = await axios.put(apiUrl, 
        { type: 'laboratories' },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      
      // Update the lab in the list
      setLaboratories(prevLabs => 
        prevLabs.map(lab => 
          lab._id === labId 
            ? { ...lab, isVerified: res.data.isVerified }
            : lab
        )
      );
      
      // Update the selected profile if it's the same lab
      if (selectedLabProfile && selectedLabProfile._id === labId) {
        setSelectedLabProfile(res.data);
      }
      
      // Show success message
      alert(verify ? 'Laboratory verified successfully!' : 'Laboratory verification removed successfully!');
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert('Failed to update verification status');
    } finally {
      setVerificationLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to top on tab change
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (activeTab === 'laboratories') {
      fetchLaboratories();
      setSelectedLabId(null);
      setShowAllAppointments(false);
      setAppointments([]);
    }
  }, [activeTab]);

  // Debug useEffect to log appointments state changes
  useEffect(() => {
    console.log('Lab appointments state changed:', appointments.length, 'appointments');
    console.log('Selected lab ID:', selectedLabId);
    console.log('Show all appointments:', showAllAppointments);
  }, [appointments, selectedLabId, showAllAppointments]);

  // Get unique values for filter options
  const allCities = Array.from(new Set(
    laboratories.map(lab => lab.city).filter(Boolean)
  )).sort();

  const filteredLabs = laboratories.filter((lab: Laboratory) => {
    const name = lab.user?.name?.toLowerCase() || '';
    const email = lab.user?.email?.toLowerCase() || '';
    const phone = lab.user?.phone || '';
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
      (verificationFilter === 'verified' && lab.isVerified) ||
      (verificationFilter === 'unverified' && !lab.isVerified);
    
    // City filter
    const matchesCity = 
      !cityFilter ||
      lab.city?.toLowerCase().includes(cityFilter.toLowerCase());
    
    // Availability filter
    const matchesAvailability = 
      availableFilter === 'all' ||
      (availableFilter === 'available' && lab.isAvailable) ||
      (availableFilter === 'unavailable' && !lab.isAvailable);
    
    return matchesSearch && matchesVerification && matchesCity && matchesAvailability;
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
          className={`px-6 py-3 rounded-xl font-semibold text-lg transition-colors ${activeTab === 'laboratories' ? 'bg-primary text-white shadow' : 'bg-muted text-icon hover:bg-primary hover:text-white'}`}
          onClick={() => setActiveTab('laboratories')}
        >
          Laboratories
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-semibold text-lg transition-colors ${activeTab === 'appointments' ? 'bg-primary text-white shadow' : 'bg-muted text-icon hover:bg-primary hover:text-white'}`}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>
      </div>
      {activeTab === 'laboratories' && (
        <div className="bg-card rounded-xl shadow p-8">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold">Laboratories</h1>
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
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
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
                    <option value="all">All Laboratories</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified Only</option>
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
                
                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <select
                    value={availableFilter}
                    onChange={(e) => setAvailableFilter(e.target.value as 'all' | 'available' | 'unavailable')}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Laboratories</option>
                    <option value="available">Available Only</option>
                    <option value="unavailable">Unavailable Only</option>
                  </select>
                </div>
                
                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setVerificationFilter('all');
                      setCityFilter('');
                      setAvailableFilter('all');
                    }}
                    className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
              
              {/* Results Count */}
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredLabs.length} of {laboratories.length} laboratories
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-8">
            {filteredLabs.length > 0 ? filteredLabs.map((lab: Laboratory) => (
              <div key={lab._id} className="relative animate-fade-in">
                <div className="flex flex-row items-center gap-4">
                  <div style={{ flex: 1 }} onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleViewProfile(e, lab)}>
                  <UserCard user={{
                    _id: lab.user?._id || '',
                    name: lab.user?.name || '',
                    email: lab.user?.email || '',
                    phone: lab.user?.phone || '',
                    role: 'laboratory',
                    isPhoneEmailVerified: true,
                    profile: lab._id,
                    isVerified: lab.isVerified,
                    createdAt: lab.createdAt ? new Date(lab.createdAt) : undefined,
                    updatedAt: lab.updatedAt ? new Date(lab.updatedAt) : undefined,
                    }} disableModal={true} />
                </div>
                  <button
                    onClick={() => handleLabCardClick(lab)}
                    className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl text-base font-semibold shadow-lg hover:from-green-500 hover:to-blue-600 hover:scale-105 transition-all flex items-center gap-2 ml-2"
                    style={{ minWidth: 180 }}
                  >
                    <FaCalendarAlt className="text-lg" />
                    Show Appointments
                  </button>
                </div>
              </div>
            )) : <div className="text-center col-span-3 text-icon">No laboratories found.</div>}
          </div>
        </div>
      )}
      {activeTab === 'appointments' && (
        <div className="bg-card rounded-xl shadow p-8">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold">Lab Appointments</h1>
            <button
              onClick={handleShowAllAppointments}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Show All Appointments
            </button>
          </div>
          {selectedLabId && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                Showing appointments for: <strong>{appointments[0]?.lab?.name || 'Selected Laboratory'}</strong>
              </p>
            </div>
          )}
          {showAllAppointments && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                <strong>Showing all lab appointments</strong>
              </p>
            </div>
          )}
          {!selectedLabId && !showAllAppointments && !loading && (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-4">Click on a laboratory card to view their appointments</p>
              <p className="text-sm text-gray-500">Or click "Show All Appointments" to view all lab appointments</p>
            </div>
          )}
          {(selectedLabId || showAllAppointments || loading) && (
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
                        <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">🏥</span>
                              Laboratory
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">👤</span>
                              Patient
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-600">🔬</span>
                              Service
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-600">💰</span>
                              Price
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">🧪</span>
                              Tests
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-orange-600">🕐</span>
                              Time Slot
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-600">📦</span>
                              Collection
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-600">📊</span>
                              Status
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
                              <span className="text-purple-600">📋</span>
                              Report
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
                            className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap min-w-[200px]">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3 flex-shrink-0">
                                  {appt.lab?.name?.charAt(0)?.toUpperCase() || 'L'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {appt.lab?.name || 'Unknown Lab'}
                                    {!appt.lab?.name && <span className="text-red-500 text-xs ml-2">(No name)</span>}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {appt.lab?.email || 'No email'}
                                    {!appt.lab?.email && <span className="text-red-500 text-xs ml-1">(No email)</span>}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Lab ID: {appt.lab?._id || 'No ID'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[200px]">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3 flex-shrink-0">
                                  {appt.patient?.name?.charAt(0)?.toUpperCase() || 'P'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate">{appt.patient?.name || '-'}</div>
                                  <div className="text-xs text-gray-500 truncate">{appt.patient?.email || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[180px]">
                              <div className="text-sm text-gray-900 font-medium truncate">{appt.laboratoryService?.name || '-'}</div>
                              {appt.laboratoryService?.description && (
                                <div className="text-xs text-gray-500 truncate">{appt.laboratoryService.description}</div>
                              )}
                              {appt.laboratoryService?.category && (
                                <div className="text-xs text-gray-400 truncate">📂 {appt.laboratoryService.category}</div>
                              )}
                              {appt.laboratoryService?.collectionType && (
                                <div className="text-xs text-gray-400 truncate">
                                  {appt.laboratoryService.collectionType === 'home' ? '🏠 Home' : 
                                   appt.laboratoryService.collectionType === 'lab' ? '🏥 Lab' : '🏠🏥 Both'}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[100px]">
                              <div className="text-sm text-gray-900 font-medium">
                                {appt.laboratoryService?.price ? `₹${appt.laboratoryService.price}` : 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                              <div className="text-sm text-gray-900 font-medium">
                                {appt.selectedTests && appt.selectedTests.length > 0 
                                  ? `${appt.selectedTests.length} test(s) selected`
                                  : appt.laboratoryService?.tests && appt.laboratoryService.tests.length > 0
                                  ? `${appt.laboratoryService.tests.length} test(s)`
                                  : 'N/A'
                                }
                              </div>
                              {appt.laboratoryService?.tests && appt.laboratoryService.tests.length > 0 && (
                                <div className="text-xs text-gray-500 truncate">
                                  {appt.laboratoryService.tests.slice(0, 2).map(test => test.name).join(', ')}
                                  {appt.laboratoryService.tests.length > 2 && '...'}
                                </div>
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
                                appt.collectionType === 'home' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {appt.collectionType === 'home' ? '🏠 Home Collection' : 
                                 appt.collectionType === 'lab' ? '🏥 Lab Visit' : 
                                 appt.collectionType || '📋 Not Specified'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                appt.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : appt.status === 'collected'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {appt.status === 'completed' ? '✅ Completed' : 
                                 appt.status === 'collected' ? '📦 Collected' : 
                                 '⏳ Upcoming'}
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
                              {appt.paymentStatus && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {appt.paymentStatus}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                              <div className="text-sm text-gray-900 truncate">
                                {appt.reportResult || 'No report'}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                              {new Date(appt.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
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
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden">
                  {selectedLabProfile?.profilePicture ? (
                    <img src={selectedLabProfile.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    selectedLabProfile?.user?.name?.charAt(0).toUpperCase() || 'L'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-gray-900">{selectedLabProfile?.user?.name || 'Laboratory'}</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 capitalize">Laboratory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${selectedLabProfile?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}> 
                      <span className="text-sm">{selectedLabProfile?.isVerified ? '\u2705' : '\u23f3'}</span>
                      <span className="text-sm font-medium">{selectedLabProfile?.isVerified ? 'Verified' : 'Pending Verification'}</span>
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
              ) : selectedLabProfile ? (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-100">Laboratory Profile</h2>
                    <div className="space-y-3">
                      <div><span className="font-semibold">Lab Name:</span> {selectedLabProfile.laboratoryName || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Email:</span> {selectedLabProfile.laboratoryEmail || selectedLabProfile.user?.email || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Phone:</span> {selectedLabProfile.laboratoryPhone || selectedLabProfile.user?.phone || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Website:</span> {selectedLabProfile.laboratoryWebsite || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Address:</span> {selectedLabProfile.laboratoryAddress?.address || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">City:</span> {selectedLabProfile.city || <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Available Days:</span> {selectedLabProfile.availableDays && selectedLabProfile.availableDays.length > 0 ? selectedLabProfile.availableDays.join(', ') : <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Available Slots:</span> {selectedLabProfile.availableSlots && selectedLabProfile.availableSlots.length > 0 ? selectedLabProfile.availableSlots.join(', ') : <span className='text-gray-400'>Not provided</span>}</div>
                      <div><span className="font-semibold">Verified:</span> {selectedLabProfile.isVerified ? 'Yes' : 'No'}</div>
                      <div><span className="font-semibold">Available:</span> {selectedLabProfile.isAvailable ? 'Yes' : 'No'}</div>
                      <div><span className="font-semibold">Created:</span> {selectedLabProfile.createdAt ? formatDate(selectedLabProfile.createdAt) : <span className='text-gray-400'>N/A</span>}</div>
                      <div><span className="font-semibold">Updated:</span> {selectedLabProfile.updatedAt ? formatDate(selectedLabProfile.updatedAt) : <span className='text-gray-400'>N/A</span>}</div>
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
                            checked={selectedLabProfile.isVerified === true}
                            onChange={() => handleVerifyLab(selectedLabProfile._id, true)}
                            disabled={verificationLoading}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Verified</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="verification"
                            checked={selectedLabProfile.isVerified === false}
                            onChange={() => handleVerifyLab(selectedLabProfile._id, false)}
                            disabled={verificationLoading}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Not Verified</span>
                        </label>
                      </div>
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

export default LaboratoriesTab; 