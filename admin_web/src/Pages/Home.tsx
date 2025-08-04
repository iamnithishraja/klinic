import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaUser, FaUserMd, FaFlask, FaTruck, FaUserShield, FaRupeeSign, FaClock,
  FaCheckCircle, FaMoneyBillWave, FaUserPlus, FaShoppingCart, FaChartLine
} from 'react-icons/fa';
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
  icon?: React.ReactNode;
  color?: string;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedToday: number;
  outForDelivery: number;
  totalRevenue: number;
  needsAssignment: number;
}

// --- Revenue Card ---
const RevenueCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}> = ({ title, value, icon, color = '', subtitle }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
          <FaRupeeSign className="text-green-600" />
          {value.toLocaleString()}
        </p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);

const ActivityFeedItem: React.FC<ActivityItem> = ({ icon, message, time, color }) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg ${color || 'bg-gray-50'}`}>
    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
      {icon || <FaUserPlus className="text-blue-600" />}
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{message}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  </div>
);

const Home: React.FC = () => {
  // --- State ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [doctorAppointments, setDoctorAppointments] = useState<Appointment[]>([]);
  const [labAppointments, setLabAppointments] = useState<Appointment[]>([]);
  const [revenue, setRevenue] = useState<{ total: number; upcoming: number }>({ total: 0, upcoming: 0 });
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [roleStats, setRoleStats] = useState<{ _id: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueDetails, setRevenueDetails] = useState<RevenueDetailsData | null>(null);
  const [initialRevenueTab, setInitialRevenueTab] = useState<'paid' | 'unpaid'>('paid');

  // --- Fetch Data ---
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_token');
        const baseUrl = import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000';
        
        // Fetch all data in parallel
        const [usersRes, doctorsRes, labsRes, deliveryRes] = await Promise.all([
          axios.get(`${baseUrl}/api/v1/admin/data?type=users`, { 
            headers: token ? { Authorization: `Bearer ${token}` } : {} 
          }),
          axios.get(`${baseUrl}/api/v1/admin/data?type=doctors`, { 
            headers: token ? { Authorization: `Bearer ${token}` } : {} 
          }),
          axios.get(`${baseUrl}/api/v1/admin/data?type=laboratories`, { 
            headers: token ? { Authorization: `Bearer ${token}` } : {} 
          }),
          axios.get(`${baseUrl}/api/v1/admin/data?type=deliverypartners`, { 
            headers: token ? { Authorization: `Bearer ${token}` } : {} 
          })
        ]);

        // Extract data with proper error handling
        const users = usersRes.data?.profiles || usersRes.data?.users || [];
        const doctors = doctorsRes.data?.profiles || [];
        const labs = labsRes.data?.profiles || [];
        const delivery = deliveryRes.data?.profiles || [];

        const statsData: DashboardStats = {
          totalUsers: users.length,
          totalDoctors: doctors.length,
          totalLabs: labs.length,
          totalDeliveryPartners: delivery.length,
          verifiedUsers: users.filter((u: any) => u.isPhoneEmailVerified).length,
          pendingUsers: users.filter((u: any) => !u.isPhoneEmailVerified).length,
          verifiedDoctors: doctors.filter((d: any) => d.isVerified).length,
          pendingDoctors: doctors.filter((d: any) => !d.isVerified).length,
          verifiedDeliveryPartners: delivery.filter((p: any) => p.isVerified).length,
          pendingDeliveryPartners: delivery.filter((p: any) => !p.isVerified).length,
        };
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Failed to fetch dashboard statistics');
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
        const baseUrl = import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000';
        
        const [doctorRes, labRes] = await Promise.all([
          axios.get(`${baseUrl}/api/v1/admin/doctor-appointments`, { 
            headers: token ? { Authorization: `Bearer ${token}` } : {} 
          }),
          axios.get(`${baseUrl}/api/v1/admin/lab-appointments`, { 
            headers: token ? { Authorization: `Bearer ${token}` } : {} 
          })
        ]);
        
        setDoctorAppointments(doctorRes.data?.appointments || []);
        setLabAppointments(labRes.data?.appointments || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
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
        const baseUrl = import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000';
        const response = await axios.get(`${baseUrl}/api/v1/admin/revenue-overview`, { 
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        });
        
        const revenueData = response.data || {};
        setRevenue({
          total: revenueData.totalRevenue || 0,
          upcoming: revenueData.upcomingRevenue || 0
        });
      } catch (error) {
        console.error('Error fetching revenue:', error);
        setRevenue({ total: 0, upcoming: 0 });
      }
    };
    fetchRevenue();
  }, []);

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const baseUrl = import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000';
        const response = await axios.get(`${baseUrl}/api/v1/admin/orders/stats`, { 
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        });
        
        if (response.data?.success && response.data?.data) {
          setOrderStats(response.data.data);
        } else {
          setOrderStats(null);
        }
      } catch (error) {
        console.error('Error fetching order stats:', error);
        setOrderStats(null);
      }
    };
    fetchOrderStats();
  }, []);

  useEffect(() => {
    const fetchActivityFeed = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const baseUrl = import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000';
        const response = await axios.get(`${baseUrl}/api/v1/admin/activity-feed`, { 
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        });
        
        // Transform the response into ActivityItem format
        const activities: ActivityItem[] = [];
        const data = response.data || {};
        
        // Add user activities
        if (data.users) {
          data.users.forEach((user: { name: string; createdAt: string }) => {
            activities.push({
              type: 'user',
              message: `New user registered: ${user.name}`,
              time: new Date(user.createdAt).toLocaleString(),
              icon: <FaUser className="text-blue-600" />,
              color: 'bg-blue-50'
            });
          });
        }
        
        // Add doctor activities
        if (data.doctors) {
          data.doctors.forEach((doctor: { user?: { name: string }; createdAt: string }) => {
            activities.push({
              type: 'doctor',
              message: `New doctor registered: ${doctor.user?.name || 'Unknown'}`,
              time: new Date(doctor.createdAt).toLocaleString(),
              icon: <FaUserMd className="text-green-600" />,
              color: 'bg-green-50'
            });
          });
        }
        
        // Add lab activities
        if (data.labs) {
          data.labs.forEach((lab: { user?: { name: string }; createdAt: string }) => {
            activities.push({
              type: 'lab',
              message: `New laboratory registered: ${lab.user?.name || 'Unknown'}`,
              time: new Date(lab.createdAt).toLocaleString(),
              icon: <FaFlask className="text-purple-600" />,
              color: 'bg-purple-50'
            });
          });
        }
        
        // Add payment activities
        if (data.doctorPayments) {
          data.doctorPayments.forEach((payment: { consultationFee: number; doctor?: { name: string }; updatedAt: string }) => {
            activities.push({
              type: 'payment',
              message: `Payment received: ₹${payment.consultationFee} from ${payment.doctor?.name || 'Doctor'}`,
              time: new Date(payment.updatedAt).toLocaleString(),
              icon: <FaMoneyBillWave className="text-green-600" />,
              color: 'bg-green-50'
            });
          });
        }
        
        setActivityFeed(activities.slice(0, 10)); // Limit to 10 most recent
      } catch (error) {
        console.error('Error fetching activity feed:', error);
        setActivityFeed([]);
      }
    };
    fetchActivityFeed();
  }, []);

  useEffect(() => {
    const fetchRoleStats = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const baseUrl = import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000';
        const response = await axios.get(`${baseUrl}/api/v1/admin/users/roles`, { 
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        });
        
        if (response.data?.roleStats) {
          setRoleStats(response.data.roleStats);
        } else {
          setRoleStats([]);
        }
      } catch (error) {
        console.error('Error fetching role stats:', error);
        setRoleStats([]);
      }
    };
    fetchRoleStats();
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'user': return <FaUser className="text-blue-600" />;
      case 'doctor': return <FaUserMd className="text-green-600" />;
      case 'laboratory': return <FaFlask className="text-purple-600" />;
      case 'delivery_boy': return <FaTruck className="text-orange-600" />;
      case 'admin': return <FaUserShield className="text-red-600" />;
      default: return <FaUser className="text-gray-600" />;
    }
  };

  const getStatusCards = () => ['pending', 'confirmed', 'completed', 'cancelled'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-600" />;
      case 'confirmed': return <FaCheckCircle className="text-blue-600" />;
      case 'completed': return <FaCheckCircle className="text-green-600" />;
      case 'cancelled': return <FaClock className="text-red-600" />;
      default: return <FaClock className="text-gray-600" />;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusCardStyle = (status: string, isActive: boolean) => {
    const baseStyle = 'flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200';
    const activeStyle = 'bg-blue-100 text-blue-700 border border-blue-200';
    const inactiveStyle = 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    return `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`;
  };

  const getStatusIconStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'confirmed': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleAppointmentStatusClick = (status: string) => {
    setSelectedStatus(status);
    setShowModal(true);
  };

  const getFilteredAppointments = (): Appointment[] => {
    const allAppointments = [...doctorAppointments, ...labAppointments];
    if (selectedStatus === 'all') return allAppointments;
    return allAppointments.filter(apt => apt.status === selectedStatus);
  };

  const getModalTitle = () => {
    if (selectedStatus === 'all') return 'All Appointments';
    return `${getStatusDisplayName(selectedStatus)} Appointments`;
  };

  const handleRevenueCardClick = async (tab: 'paid' | 'unpaid') => {
    try {
      setInitialRevenueTab(tab);
      const token = localStorage.getItem('admin_token');
      const baseUrl = import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000';
      const response = await axios.get(`${baseUrl}/api/v1/admin/revenue-details`, { 
        headers: token ? { Authorization: `Bearer ${token}` } : {} 
      });
      setRevenueDetails(response.data);
      setShowRevenueModal(true);
    } catch (error) {
      console.error('Error fetching revenue details:', error);
    }
  };

  // Calculate total revenue from appointments and orders
  const totalRevenue = (Number(revenue?.total || 0) + Number(orderStats?.totalRevenue || 0));

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
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

      {/* Total Revenue Section */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Total Revenue Overview</h2>
            <p className="text-green-100 text-lg">Combined revenue from appointments and orders</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <FaChartLine className="text-white text-3xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-white flex items-center gap-1">
                  <FaRupeeSign className="inline-block" />
                  {totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FaMoneyBillWave className="text-white text-2xl" />
              </div>
            </div>
            <p className="text-green-100 text-xs">Appointments + Orders</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm font-medium">Appointments Revenue</p>
                <p className="text-3xl font-bold text-white flex items-center gap-1">
                  <FaRupeeSign className="inline-block" />
                  {Number(revenue.total || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FaUserMd className="text-white text-2xl" />
              </div>
            </div>
            <p className="text-green-100 text-xs">Doctor & Lab appointments</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm font-medium">Orders Revenue</p>
                <p className="text-3xl font-bold text-white flex items-center gap-1">
                  <FaRupeeSign className="inline-block" />
                  {Number(orderStats?.totalRevenue || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FaShoppingCart className="text-white text-2xl" />
              </div>
            </div>
            <p className="text-green-100 text-xs">Medicine & Lab orders</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <RevenueCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<FaUser className="text-blue-600 text-xl" />}
            subtitle={`${stats.verifiedUsers} verified, ${stats.pendingUsers} pending`}
          />
          <RevenueCard
            title="Total Doctors"
            value={stats.totalDoctors}
            icon={<FaUserMd className="text-green-600 text-xl" />}
            subtitle={`${stats.verifiedDoctors} verified, ${stats.pendingDoctors} pending`}
          />
          <RevenueCard
            title="Total Laboratories"
            value={stats.totalLabs}
            icon={<FaFlask className="text-purple-600 text-xl" />}
            subtitle="Active laboratories"
          />
          <RevenueCard
            title="Delivery Partners"
            value={stats.totalDeliveryPartners}
            icon={<FaTruck className="text-orange-600 text-xl" />}
            subtitle={`${stats.verifiedDeliveryPartners} verified, ${stats.pendingDeliveryPartners} pending`}
          />
        </div>
      )}

      {/* Role Distribution */}
      {roleStats.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">User Role Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roleStats.map((stat: { _id: string; count: number }) => (
              <div key={stat._id} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {getRoleIcon(stat._id)}
                </div>
                <p className="text-sm font-medium text-gray-600 capitalize">{stat._id}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Stats */}
      {orderStats && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Order Management</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FaShoppingCart className="text-blue-600 text-2xl mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.totalOrders}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <FaClock className="text-yellow-600 text-2xl mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.pendingOrders}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <FaCheckCircle className="text-green-600 text-2xl mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.completedToday}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <FaTruck className="text-orange-600 text-2xl mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Out for Delivery</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.outForDelivery}</p>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Status Cards */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Appointment Status</h3>
        <div className="flex flex-wrap gap-3">
          {getStatusCards().map((status) => (
            <div
              key={status}
              className={getStatusCardStyle(status, selectedStatus === status)}
              onClick={() => handleAppointmentStatusClick(status)}
            >
              <div className={getStatusIconStyle(status)}>
                {getStatusIcon(status)}
              </div>
              <span className="font-medium">{getStatusDisplayName(status)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      {activityFeed.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activityFeed.map((activity, index) => (
              <ActivityFeedItem key={index} {...activity} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <DashboardModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={getModalTitle()}
        >
          <div className="space-y-4">
            {selectedStatus === 'all' ? (
              <>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Doctor Appointments</h4>
                  <DoctorAppointmentsTable appointments={doctorAppointments} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Laboratory Appointments</h4>
                  <LabAppointmentsTable appointments={labAppointments} />
                </div>
              </>
            ) : (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{getModalTitle()}</h4>
                {selectedStatus === 'doctor' ? (
                  <DoctorAppointmentsTable appointments={getFilteredAppointments()} />
                ) : (
                  <LabAppointmentsTable appointments={getFilteredAppointments()} />
                )}
              </div>
            )}
          </div>
        </DashboardModal>
      )}

      {showRevenueModal && revenueDetails && (
        <RevenueDetailsModal
          open={showRevenueModal}
          onClose={() => setShowRevenueModal(false)}
          revenueData={revenueDetails}
          initialTab={initialRevenueTab}
        />
      )}
    </div>
  );
};

export default Home;