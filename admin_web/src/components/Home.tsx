import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Hello World</h1>
          <p className="text-xl text-gray-600 mb-8">Welcome to the Klinic Admin Panel</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">👥</div>
            <h3 className="text-lg font-semibold text-blue-800">Users</h3>
            <p className="text-sm text-gray-600">Manage user accounts and profiles</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">👨‍⚕️</div>
            <h3 className="text-lg font-semibold text-green-800">Doctors</h3>
            <p className="text-sm text-gray-600">Manage doctor profiles and schedules</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">🏥</div>
            <h3 className="text-lg font-semibold text-purple-800">Laboratories</h3>
            <p className="text-sm text-gray-600">Manage lab services and appointments</p>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">1,234</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">456</p>
              <p className="text-sm text-gray-600">Total Doctors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">89</p>
              <p className="text-sm text-gray-600">Total Labs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">2,341</p>
              <p className="text-sm text-gray-600">Total Appointments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 