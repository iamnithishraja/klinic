import React, { useState, useEffect, useCallback } from 'react';
import { FaClipboardList, FaClock, FaCheckCircle, FaTruck, FaRupeeSign, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedToday: number;
  outForDelivery: number;
  totalRevenue: number;
  averageOrderValue: number;
  needsAssignment: number;
}

const OrderStats: React.FC = () => {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load order statistics - Memoized to prevent unnecessary re-renders
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/orders/stats';
      
      // Get auth token
      const token = localStorage.getItem('admin_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(apiUrl, { headers });
      console.log('Order stats response:', response.data);
      if (response.data.success && response.data.data) {
        setStats(response.data.data);
      } else if (response.data.success && response.data) {
        // Handle case where data is directly in response.data
        setStats(response.data);
      } else {
        console.warn('No stats found or invalid response structure');
        setStats(null);
      }
    } catch (err) {
      console.error('Failed to load order stats:', err);
      setError('Failed to load order statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="animate-spin text-blue-600 text-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaClipboardList className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading statistics</h3>
          <p className="text-gray-500 mb-4">{error || 'Failed to load order statistics'}</p>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statsConfig = [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: <FaClipboardList className="text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toLocaleString(),
      icon: <FaClock className="text-yellow-600" />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday.toLocaleString(),
      icon: <FaCheckCircle className="text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600'
    },
    {
      title: 'Out for Delivery',
      value: stats.outForDelivery.toLocaleString(),
      icon: <FaTruck className="text-orange-600" />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-600'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: <FaRupeeSign className="text-purple-600" />,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600'
    },
    {
      title: 'Needs Assignment',
      value: stats.needsAssignment.toLocaleString(),
      icon: <FaExclamationTriangle className="text-red-600" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statsConfig.map((stat, index) => (
        <div
          key={index}
          className={`bg-white rounded-xl shadow-sm border ${stat.borderColor} p-6 hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
              {stat.icon}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderStats; 