import React from 'react';

const DoctorsTab: React.FC = () => {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Doctors Management</h1>
        <p className="text-gray-600 mb-6">Manage all doctors in the system</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Total Doctors</h3>
            <p className="text-2xl font-bold text-green-600">456</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Available</h3>
            <p className="text-2xl font-bold text-blue-600">321</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">Busy</h3>
            <p className="text-2xl font-bold text-yellow-600">135</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Specializations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 p-3 rounded text-center">
              <p className="font-semibold">Cardiology</p>
              <p className="text-sm text-gray-600">45 doctors</p>
            </div>
            <div className="bg-gray-100 p-3 rounded text-center">
              <p className="font-semibold">Dermatology</p>
              <p className="text-sm text-gray-600">32 doctors</p>
            </div>
            <div className="bg-gray-100 p-3 rounded text-center">
              <p className="font-semibold">Neurology</p>
              <p className="text-sm text-gray-600">28 doctors</p>
            </div>
            <div className="bg-gray-100 p-3 rounded text-center">
              <p className="font-semibold">Pediatrics</p>
              <p className="text-sm text-gray-600">41 doctors</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorsTab; 