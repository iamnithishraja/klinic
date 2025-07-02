import React from 'react';

const LaboratoriesTab: React.FC = () => {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-purple-600 mb-4">Laboratories Management</h1>
        <p className="text-gray-600 mb-6">Manage all laboratories in the system</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">Total Labs</h3>
            <p className="text-2xl font-bold text-purple-600">89</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Active Labs</h3>
            <p className="text-2xl font-bold text-green-600">76</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800">Pending Approval</h3>
            <p className="text-2xl font-bold text-orange-600">13</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Lab Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 p-3 rounded text-center">
              <p className="font-semibold">Blood Tests</p>
              <p className="text-sm text-gray-600">Available in 68 labs</p>
            </div>
            <div className="bg-gray-100 p-3 rounded text-center">
              <p className="font-semibold">X-Ray</p>
              <p className="text-sm text-gray-600">Available in 45 labs</p>
            </div>
            <div className="bg-gray-100 p-3 rounded text-center">
              <p className="font-semibold">MRI</p>
              <p className="text-sm text-gray-600">Available in 23 labs</p>
            </div>
            <div className="bg-gray-100 p-3 rounded text-center">
              <p className="font-semibold">CT Scan</p>
              <p className="text-sm text-gray-600">Available in 31 labs</p>
            </div>
            <div className="bg-gray-100 p-3 rounded text-center">
              <p className="font-semibold">Ultrasound</p>
              <p className="text-sm text-gray-600">Available in 52 labs</p>
            </div>
            <div className="bg-gray-100 p-3 rounded text-center">
              <p className="font-semibold">Pathology</p>
              <p className="text-sm text-gray-600">Available in 61 labs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratoriesTab; 