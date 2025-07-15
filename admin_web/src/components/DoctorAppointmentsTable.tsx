import React from 'react';

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
  status: string;
  isPaid: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  consultationFee?: number;
}

interface DoctorAppointmentsTableProps {
  appointments: Appointment[];
  loading?: boolean;
  error?: string | null;
}

const DoctorAppointmentsTable: React.FC<DoctorAppointmentsTableProps> = ({ 
  appointments, 
  loading = false, 
  error = null 
}) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <span className="text-gray-500 text-lg">Loading appointments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">{error}</div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No appointments found.</div>
    );
  }

  return (
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
                  <span className="text-green-600">💵</span>
                  Fee
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
                  <div className="text-sm font-medium text-gray-900">
                    ₹{appt.consultationFee || 0}
                  </div>
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
                <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                  <div className="text-sm text-gray-900">
                    {appt.createdAt ? new Date(appt.createdAt).toLocaleDateString() : '-'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {appt.createdAt ? new Date(appt.createdAt).toLocaleTimeString() : '-'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorAppointmentsTable; 