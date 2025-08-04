import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaUser, FaUserMd, FaFlask, FaTruck, FaUserShield, FaRupeeSign, FaClock, FaCheckCircle, FaMoneyBillWave, FaUserPlus } from 'react-icons/fa';
import DashboardModal from '../components/DashboardModal';
import DoctorAppointmentsTable from '../components/DoctorAppointmentsTable';
import LabAppointmentsTable from '../components/LabAppointmentsTable';
import RevenueDetailsModal from '../components/RevenueDetailsModal';
import type { RevenueDetailsData } from '../components/RevenueDetailsModal';

// --- Types ---
interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalLabs: number;
  totalDeliveryPartners: number;
  verifiedUsers: number;
  pendingUsers: number;
  verifiedDoctors: number;
  pendingDoctors: number;
  verifiedDeliveryPartners: number;
  pendingDeliveryPartners: number;
}

interface Appointment {
  _id: string;
  status: string;
  isPaid: boolean;
  timeSlot: string | Date;
  createdAt?: string;
  updatedAt?: string;
  consultationFee?: number;
  price?: number;
  doctor?: { name?: string; _id?: string; email?: string; phone?: string };
  lab?: { name?: string; _id?: string; email?: string; phone?: string };
  laboratoryService?: { 
    name?: string; 
    price?: number;
    description?: string;
    category?: string;
    collectionType?: 'home' | 'lab' | 'both';
    tests?: Array<{
      name: string;
      description?: string;
      price?: number;
    }>;
  };
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
  consultationType?: 'in-person' | 'online' | 'both';
  prescription?: string;
  notes?: string;
  selectedTests?: number[];
  collectionType?: 'lab' | 'home';
  reportResult?: string;
}

interface ActivityItem {
  type: 'user' | 'doctor' | 'lab' | 'delivery' | 'payment' | 'verification';
  message: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

// --- Revenue Card ---
const RevenueCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color?: string; subtitle?: string; }> = ({ title, value, icon, color = '', subtitle }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-green-700 flex items-center gap-1"><FaRupeeSign className="inline-block" />{value.toLocaleString()}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <span className="text-2xl text-white">{icon}</span>
      </div>
    </div>
      </div>
);

// --- Activity Feed Item ---
const ActivityFeedItem: React.FC<ActivityItem> = ({ icon, message, time, color }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100 shadow-sm">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
    <div className="flex-1">
      <div className="text-sm text-gray-900">{message}</div>
      <div className="text-xs text-gray-400">{time}</div>
    </div>
  </div>
);

// --- Main Dashboard ---
const Home: React.FC = () => {
  // --- State ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorAppointments, setDoctorAppointments] = useState<Appointment[]>([]);
  const [labAppointments, setLabAppointments] = useState<Appointment[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [revenue, setRevenue] = useState<{ total: number; upcoming: number }>({ total: 0, upcoming: 0 });
  const [orderRevenue, setOrderRevenue] = useState<number>(0);
  const [activeAppointmentTab, setActiveAppointmentTab] = useState<'doctor' | 'lab'>('doctor');
  // Add roleStats state and fetch logic
  const [roleStats, setRoleStats] = useState<{ _id: string; count: number }[]>([]);
  
  // Modal state for appointment details
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<'doctor' | 'lab'>('doctor');
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState<string>('');

  // Revenue Details Modal State
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueDetails, setRevenueDetails] = useState<RevenueDetailsData | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [initialRevenueTab, setInitialRevenueTab] = useState<'paid' | 'unpaid'>('paid');

  // --- Fetch Data ---
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
        const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/data';
        const [usersRes, doctorsRes, labsRes, deliveryRes] = await Promise.all([
          axios.get(apiUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {}, params: { type: 'users' } }),
          axios.get(apiUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {}, params: { type: 'doctors' } }),
          axios.get(apiUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {}, params: { type: 'laboratories' } }),
          axios.get(apiUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {}, params: { type: 'deliverypartners' } }),
        ]);
        const users = Array.isArray(usersRes.data.profiles) ? usersRes.data.profiles : [];
        const doctors = Array.isArray(doctorsRes.data.profiles) ? doctorsRes.data.profiles : [];
        const labs = Array.isArray(labsRes.data.profiles) ? labsRes.data.profiles : [];
        const delivery = Array.isArray(deliveryRes.data.profiles) ? deliveryRes.data.profiles : [];
      setStats({
        totalUsers: users.length,
        totalDoctors: doctors.length,
        totalLabs: labs.length,
          totalDeliveryPartners: delivery.length,
          verifiedUsers: users.filter((u: { isPhoneEmailVerified?: boolean }) => u.isPhoneEmailVerified).length,
          pendingUsers: users.filter((u: { isPhoneEmailVerified?: boolean }) => !u.isPhoneEmailVerified).length,
          verifiedDoctors: doctors.filter((d: { isVerified?: boolean }) => d.isVerified).length,
          pendingDoctors: doctors.filter((d: { isVerified?: boolean }) => !d.isVerified).length,
          verifiedDeliveryPartners: delivery.filter((p: { isVerified?: boolean }) => p.isVerified).length,
          pendingDeliveryPartners: delivery.filter((p: { isVerified?: boolean }) => !p.isVerified).length,
        });
      } catch {
        setStats(null);
    } finally {
      setLoading(false);
    }
  };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const doctorApi = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/doctor-appointments';
        const labApi = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/lab-appointments';
        const [doctorRes, labRes] = await Promise.all([
          axios.get(doctorApi, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          axios.get(labApi, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        ]);
        setDoctorAppointments(doctorRes.data.appointments || []);
        setLabAppointments(labRes.data.appointments || []);
      } catch {
        setDoctorAppointments([]);
        setLabAppointments([]);
      }
    };
    fetchAppointments();
  }, []);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const url = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/revenue-overview';
        const res = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setRevenue({ total: res.data.totalRevenue || 0, upcoming: res.data.upcomingRevenue || 0 });
      } catch {
        setRevenue({ total: 0, upcoming: 0 });
      }
    };
    fetchRevenue();
  }, []);

  useEffect(() => {
    const fetchOrderRevenue = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const url = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/orders/stats';
        const res = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setOrderRevenue(res.data.data?.totalRevenue || 0);
      } catch {
        setOrderRevenue(0);
      }
    };
    fetchOrderRevenue();
  }, []);

  useEffect(() => {
    const fetchActivityFeed = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const url = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/activity-feed';
        const res = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const { users, doctors, labs, deliveryPartners, doctorPayments, labPayments }: {
          users: unknown[];
          doctors: unknown[];
          labs: unknown[];
          deliveryPartners: unknown[];
          doctorPayments: unknown[];
          labPayments: unknown[];
        } = res.data;
        const feed: ActivityItem[] = [];
        (Array.isArray(users) ? users : []).forEach((u) => feed.push({
          type: 'user',
          message: `New user registered: ${typeof (u as Record<string, unknown>).name === 'string' ? (u as Record<string, unknown>).name : (typeof (u as Record<string, unknown>).email === 'string' ? (u as Record<string, unknown>).email : 'User')}`,
          time: typeof (u as Record<string, unknown>).createdAt === 'string' ? new Date((u as Record<string, unknown>).createdAt as string).toLocaleString() : '',
          icon: <FaUserPlus />, color: 'bg-blue-100 text-blue-700'
        }));
        (Array.isArray(doctors) ? doctors : []).forEach((d) => feed.push({
          type: 'doctor',
          message: `Doctor profile created: ${(d as Record<string, unknown>).user && typeof ((d as Record<string, unknown>).user as Record<string, unknown>).name === 'string' ? ((d as Record<string, unknown>).user as Record<string, unknown>).name : ((d as Record<string, unknown>).user && typeof ((d as Record<string, unknown>).user as Record<string, unknown>).email === 'string' ? ((d as Record<string, unknown>).user as Record<string, unknown>).email : 'Doctor')}`,
          time: typeof (d as Record<string, unknown>).createdAt === 'string' ? new Date((d as Record<string, unknown>).createdAt as string).toLocaleString() : '',
          icon: <FaUserMd />, color: 'bg-green-100 text-green-700'
        }));
        (Array.isArray(labs) ? labs : []).forEach((l) => feed.push({
          type: 'lab',
          message: `Lab profile created: ${(l as Record<string, unknown>).user && typeof ((l as Record<string, unknown>).user as Record<string, unknown>).name === 'string' ? ((l as Record<string, unknown>).user as Record<string, unknown>).name : ((l as Record<string, unknown>).user && typeof ((l as Record<string, unknown>).user as Record<string, unknown>).email === 'string' ? ((l as Record<string, unknown>).user as Record<string, unknown>).email : 'Lab')}`,
          time: typeof (l as Record<string, unknown>).createdAt === 'string' ? new Date((l as Record<string, unknown>).createdAt as string).toLocaleString() : '',
          icon: <FaFlask />, color: 'bg-purple-100 text-purple-700'
        }));
        (Array.isArray(deliveryPartners) ? deliveryPartners : []).forEach((p) => feed.push({
          type: 'delivery',
          message: `Delivery partner profile created: ${(p as Record<string, unknown>).user && typeof ((p as Record<string, unknown>).user as Record<string, unknown>).name === 'string' ? ((p as Record<string, unknown>).user as Record<string, unknown>).name : ((p as Record<string, unknown>).user && typeof ((p as Record<string, unknown>).user as Record<string, unknown>).email === 'string' ? ((p as Record<string, unknown>).user as Record<string, unknown>).email : 'Delivery Partner')}`,
          time: typeof (p as Record<string, unknown>).createdAt === 'string' ? new Date((p as Record<string, unknown>).createdAt as string).toLocaleString() : '',
          icon: <FaTruck />, color: 'bg-yellow-100 text-yellow-700'
        }));
        (Array.isArray(doctorPayments) ? doctorPayments : []).forEach((pay) => feed.push({
          type: 'payment',
          message: `Doctor payment received: ₹${typeof (pay as Record<string, unknown>).consultationFee === 'number' ? (pay as Record<string, unknown>).consultationFee : 0}`,
          time: typeof (pay as Record<string, unknown>).updatedAt === 'string' ? new Date((pay as Record<string, unknown>).updatedAt as string).toLocaleString() : '',
          icon: <FaMoneyBillWave />, color: 'bg-green-100 text-green-700'
        }));
        (Array.isArray(labPayments) ? labPayments : []).forEach((pay) => feed.push({
          type: 'payment',
          message: `Lab payment received: ₹${typeof (pay as Record<string, unknown>).totalPrice === 'number' ? (pay as Record<string, unknown>).totalPrice : 0}`,
          time: typeof (pay as Record<string, unknown>).updatedAt === 'string' ? new Date((pay as Record<string, unknown>).updatedAt as string).toLocaleString() : '',
          icon: <FaMoneyBillWave />, color: 'bg-green-100 text-green-700'
        }));
        // Sort by time descending and take only the top 10
        const sortedFeed = feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setActivityFeed(sortedFeed.slice(0, 10));
      } catch {
        setActivityFeed([]);
      }
    };
    fetchActivityFeed();
  }, []);

  // Add roleStats state and fetch logic
  useEffect(() => {
    const fetchRoleStats = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/users/roles';
        const res = await axios.get(apiUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setRoleStats(res.data.roleStats || []);
      } catch {
        setRoleStats([]);
      }
    };
    fetchRoleStats();
  }, []);

  // Helper for role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <FaUserShield className="text-red-500" />;
      case 'doctor': return <FaUserMd className="text-blue-500" />;
      case 'laboratory': return <FaFlask className="text-green-500" />;
      case 'deliverypartner': return <FaTruck className="text-orange-500" />;
      default: return <FaUser className="text-gray-500" />;
    }
  };

  // --- Appointment Status Aggregation ---
  const aggregateAppointments = (appointments: Appointment[], type: 'doctor' | 'lab') => {
    const statusMap: Record<string, Appointment[]> = {};
    appointments.forEach((apt) => {
      let status = apt.status;
      if (type === 'lab' && status === 'pending') status = 'upcoming';
      if (!statusMap[status]) statusMap[status] = [];
      statusMap[status].push(apt);
    });
    return statusMap;
  };
  const doctorStatus = useMemo(() => aggregateAppointments(doctorAppointments, 'doctor'), [doctorAppointments]);
  const labStatus = useMemo(() => aggregateAppointments(labAppointments, 'lab'), [labAppointments]);

  // Get status cards based on appointment type
  const getStatusCards = () => {
    if (activeAppointmentTab === 'doctor') {
      return ['upcoming', 'completed'];
    } else {
      return ['upcoming', 'processing', 'marked-as-read'];
    }
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <FaClock className="text-yellow-500" />;
      case 'processing': return <FaClock className="text-blue-500" />; // Changed from FaBell to FaClock
      case 'completed': return <FaCheckCircle className="text-green-500" />;
      case 'marked-as-read': return <FaCheckCircle className="text-purple-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'marked-as-read': return 'Marked as Read';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusCardStyle = (status: string, isActive: boolean) => {
    const baseClasses = "rounded-xl p-6 border shadow-sm cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg";
    
    if (isActive) {
      // Active tab styling
      switch (status) {
        case 'upcoming':
          return `${baseClasses} bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:border-yellow-300`;
        case 'processing':
          return `${baseClasses} bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300`;
        case 'completed':
          return `${baseClasses} bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:border-green-300`;
        case 'marked-as-read':
          return `${baseClasses} bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:border-purple-300`;
        default:
          return `${baseClasses} bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300`;
      }
    } else {
      // Inactive tab styling
      return `${baseClasses} bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50`;
    }
  };

  const getStatusIconStyle = (status: string) => {
    switch (status) {
      case 'Upcoming': return "w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center";
      case 'Processing': return "w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center";
      case 'Completed': return "w-8 h-8 rounded-full bg-green-100 flex items-center justify-center";
      case 'Marked as Read': return "w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center";
      default: return "w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center";
    }
  };

  // Handle appointment status card click
  const handleAppointmentStatusClick = (status: string) => {
    setSelectedAppointmentType(activeAppointmentTab);
    setSelectedAppointmentStatus(status);
    setShowAppointmentModal(true);
  };

  // Get filtered appointments for modal
  const getFilteredAppointments = (): Appointment[] => {
    if (selectedAppointmentType === 'doctor') {
      return doctorStatus[selectedAppointmentStatus] || [];
    } else {
      return labStatus[selectedAppointmentStatus] || [];
    }
  };

  // Get modal title
  const getModalTitle = () => {
    const typeText = selectedAppointmentType === 'doctor' ? 'Doctor' : 'Laboratory';
    const statusText = getStatusDisplayName(selectedAppointmentStatus);
    return `${typeText} Appointments - ${statusText}`;
  };

  // Handler to open revenue modal and fetch details
  const handleRevenueCardClick = async (tab: 'paid' | 'unpaid') => {
    setRevenueLoading(true);
    setShowRevenueModal(true);
    setInitialRevenueTab(tab);
    try {
      const token = localStorage.getItem('admin_token');
      const url = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/revenue-details';
      const res = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setRevenueDetails(res.data);
    } catch {
      setRevenueDetails(null);
    } finally {
      setRevenueLoading(false);
    }
  };

  // --- Loading State ---
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="space-y-10 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 text-lg">Professional overview and management for Klinic platform.</p>
          </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">Last updated</span>
          <span className="text-sm font-medium text-gray-900">{new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Role Statistics (from Role Management) */}
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

      {/* Revenue & Appointments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div onClick={() => handleRevenueCardClick('paid')} className="cursor-pointer">
          <RevenueCard title="Total Revenue" value={revenue.total} icon={<FaMoneyBillWave />} color="hover:bg-green-50" subtitle="All paid doctor and lab appointments" />
        </div>
        <div onClick={() => handleRevenueCardClick('unpaid')} className="cursor-pointer">
          <RevenueCard title="Upcoming Revenue" value={revenue.upcoming} icon={<FaClock />} color="hover:bg-yellow-50" subtitle="Unpaid doctor and lab appointments" />
        </div>
        <div className="cursor-pointer">
          <RevenueCard title="Order Revenue" value={orderRevenue} icon={<FaMoneyBillWave />} color="hover:bg-purple-50" subtitle="Total revenue from orders" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Appointments Overview</h2>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button 
                className={`px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${
                  activeAppointmentTab === 'doctor' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-transparent text-gray-700 hover:bg-gray-200'
                }`} 
                onClick={() => setActiveAppointmentTab('doctor')}
              >
                <div className="flex items-center gap-2">
                  <FaUserMd className="text-sm" />
                  Doctor
              </div>
              </button>
              <button 
                className={`px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${
                  activeAppointmentTab === 'lab' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-transparent text-gray-700 hover:bg-gray-200'
                }`} 
                onClick={() => setActiveAppointmentTab('lab')}
              >
                <div className="flex items-center gap-2">
                  <FaFlask className="text-sm" />
                  Laboratory
              </div>
              </button>
            </div>
              </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getStatusCards().map((status) => (
              <div 
                key={status} 
                className={getStatusCardStyle(status, activeAppointmentTab === 'lab' ? status === 'processing' || status === 'marked-as-read' : status === 'Completed') + ' transition-transform duration-200 hover:scale-105 hover:shadow-xl'}
                onClick={() => handleAppointmentStatusClick(status)}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-start gap-4">
                  <div className={getStatusIconStyle(status)}>
                    {getStatusIcon(status)}
              </div>
                  <div className="flex-1">
                    <div className="font-semibold capitalize text-gray-800 mb-1">{getStatusDisplayName(status)}</div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {activeAppointmentTab === 'doctor' ? (doctorStatus[status]?.length || 0) : (labStatus[status]?.length || 0)}
            </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {activeAppointmentTab === 'doctor' ? 'Doctor' : 'Lab'} appointments
              </div>
                    <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <span>Click to view details</span>
                      <span>→</span>
              </div>
            </div>
              </div>
              </div>
            ))}
          </div>
        </div>
        {/* Recent Activity Feed - now more prominent and styled */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity Feed</h2>
          <div className="space-y-4 overflow-y-auto max-h-[420px] pr-2">
            {activityFeed.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No recent activity.</div>
            ) : (
              activityFeed.slice(0, 10).map((item, i) => (
              <ActivityFeedItem key={i} {...item} />
              ))
            )}
          </div>
            </div>
          </div>
      {/* Appointment Details Modal */}
      <DashboardModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        title={getModalTitle()}
        size="xl"
      >
        <div className="p-6">
          {selectedAppointmentType === 'doctor' ? (
            <DoctorAppointmentsTable 
              appointments={getFilteredAppointments()}
              loading={false}
              error={null}
            />
          ) : (
            <LabAppointmentsTable 
              appointments={getFilteredAppointments()}
              loading={false}
              error={null}
            />
          )}
            </div>
      </DashboardModal>

      {/* Revenue Details Modal */}
      <RevenueDetailsModal
        open={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        revenueData={revenueDetails || { paidDoctorAppointments: [], unpaidDoctorAppointments: [], paidLabAppointments: [], unpaidLabAppointments: [], totalDoctorRevenue: 0, totalLabRevenue: 0, upcomingDoctorRevenue: 0, upcomingLabRevenue: 0 }}
        initialTab={initialRevenueTab}
      />
      {revenueLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-4"></div>
            <span className="text-green-700 text-lg">Loading revenue details...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;