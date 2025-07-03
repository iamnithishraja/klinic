import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

interface UserProfile {
  isPhoneEmailVerified?: boolean;
}

interface DoctorProfile {
  isVerified?: boolean;
}

interface DeliveryPartnerProfile {
  isVerified?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = '', subtitle }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <span className="text-2xl text-white">{icon}</span>
      </div>
    </div>
  </div>
);

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
  onClick: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, description, icon, color = '', onClick }) => (
  <div 
    className={`bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group ${color}`}
    onClick={onClick}
  >
    <div className="flex items-center mb-4">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4">
        <span className="text-xl text-white">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

const Home: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalLabs: 0,
    totalDeliveryPartners: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    verifiedDoctors: 0,
    pendingDoctors: 0,
    verifiedDeliveryPartners: 0,
    pendingDeliveryPartners: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl =
        (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') +
        '/api/v1/admin/data';

      // Fetch users
      const usersRes = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { type: 'users' }
      });

      // Fetch doctors
      const doctorsRes = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { type: 'doctors' }
      });

      // Fetch laboratories
      const labsRes = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { type: 'laboratories' }
      });

      // Fetch delivery partners
      const deliveryPartnersRes = await axios.get(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { type: 'deliverypartners' }
      });

      const users: UserProfile[] = Array.isArray(usersRes.data.profiles) ? usersRes.data.profiles : [];
      const doctors: DoctorProfile[] = Array.isArray(doctorsRes.data.profiles) ? doctorsRes.data.profiles : [];
      const labs: unknown[] = Array.isArray(labsRes.data.profiles) ? labsRes.data.profiles : [];
      const deliveryPartners: DeliveryPartnerProfile[] = Array.isArray(deliveryPartnersRes.data.profiles) ? deliveryPartnersRes.data.profiles : [];

      setStats({
        totalUsers: users.length,
        totalDoctors: doctors.length,
        totalLabs: labs.length,
        totalDeliveryPartners: deliveryPartners.length,
        verifiedUsers: users.filter((user) => user.isPhoneEmailVerified === true).length,
        pendingUsers: users.filter((user) => user.isPhoneEmailVerified === false || user.isPhoneEmailVerified === undefined).length,
        verifiedDoctors: doctors.filter((doctor) => doctor.isVerified === true).length,
        pendingDoctors: doctors.filter((doctor) => doctor.isVerified === false || doctor.isVerified === undefined).length,
        verifiedDeliveryPartners: deliveryPartners.filter((partner) => partner.isVerified === true).length,
        pendingDeliveryPartners: deliveryPartners.filter((partner) => partner.isVerified === false || partner.isVerified === undefined).length
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setStats({
        totalUsers: 0,
        totalDoctors: 0,
        totalLabs: 0,
        totalDeliveryPartners: 0,
        verifiedUsers: 0,
        pendingUsers: 0,
        verifiedDoctors: 0,
        pendingDoctors: 0,
        verifiedDeliveryPartners: 0,
        pendingDeliveryPartners: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, Administrator! 👋</h1>
            <p className="text-gray-600 text-lg">Here's what's happening with your Klinic platform today.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-900">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="hover:border-blue-200"
          subtitle={`${stats.verifiedUsers} verified, ${stats.pendingUsers} pending`}
        />
        <StatCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon="👨‍⚕️"
          color="hover:border-green-200"
          subtitle={`${stats.verifiedDoctors} verified, ${stats.pendingDoctors} pending`}
        />
        <StatCard
          title="Total Laboratories"
          value={stats.totalLabs}
          icon="🏥"
          color="hover:border-purple-200"
          subtitle={`Active lab services`}
        />
        <StatCard
          title="Total Delivery Partners"
          value={stats.totalDeliveryPartners}
          icon="🚚"
          color="hover:border-yellow-200"
          subtitle={`${stats.verifiedDeliveryPartners} verified, ${stats.pendingDeliveryPartners} pending`}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickActionCard
                title="Manage Users"
                description="View and manage all registered users, their profiles, and verification status."
                icon="👤"
                color="hover:border-blue-200"
                onClick={() => (window.location.href = '/users')}
              />
              <QuickActionCard
                title="Doctor Management"
                description="Review doctor profiles, verify credentials, and manage schedules."
                icon="👨‍⚕️"
                color="hover:border-green-200"
                onClick={() => (window.location.href = '/doctors')}
              />
              <QuickActionCard
                title="Laboratory Services"
                description="Manage laboratory services, test orders, and result management."
                icon="🏥"
                color="hover:border-purple-200"
                onClick={() => (window.location.href = '/laboratories')}
              />
              <QuickActionCard
                title="Delivery Partner Management"
                description="Manage delivery partners, verify their profiles, and assign tasks."
                icon="🚚"
                color="hover:border-yellow-200"
                onClick={() => (window.location.href = '/deliverypartners')}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New doctor verified</p>
                <p className="text-xs text-gray-500">Dr. Sarah Johnson - Cardiology</p>
                <p className="text-xs text-gray-400">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm">👤</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New user registered</p>
                <p className="text-xs text-gray-500">John Doe - Patient</p>
                <p className="text-xs text-gray-400">4 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 text-sm">🏥</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Lab service added</p>
                <p className="text-xs text-gray-500">Advanced Blood Test - City Lab</p>
                <p className="text-xs text-gray-400">6 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-600 text-sm">🚚</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New delivery partner onboarded</p>
                <p className="text-xs text-gray-500">Ravi Kumar - Partner</p>
                <p className="text-xs text-gray-400">8 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <div>
              <p className="font-medium text-green-800">API Server</p>
              <p className="text-sm text-green-600">Online & Healthy</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            <div>
              <p className="font-medium text-blue-800">Database</p>
              <p className="text-sm text-blue-600">Connected & Stable</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
            <div>
              <p className="font-medium text-purple-800">File Storage</p>
              <p className="text-sm text-purple-600">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;