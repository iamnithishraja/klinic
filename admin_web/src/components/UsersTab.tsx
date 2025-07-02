import React from 'react';

const UsersTab: React.FC = () => {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Users Management</h1>
        <p className="text-gray-600 mb-6">Manage all users in the system</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Total Users</h3>
            <p className="text-2xl font-bold text-blue-600">1,234</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Active Users</h3>
            <p className="text-2xl font-bold text-green-600">1,156</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800">Inactive Users</h3>
            <p className="text-2xl font-bold text-red-600">78</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500">User list and management features would go here...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersTab; 