import React, { useState, useEffect } from 'react';

interface UserRef {
  name?: string;
  email?: string;
  phone?: string;
  _id?: string;
}

interface DoctorAppointment {
  _id: string;
  patient?: UserRef;
  doctor?: UserRef;
  consultationFee?: number;
  consultationType?: string;
  createdAt?: string;
}

interface LabServiceRef {
  name?: string;
  price?: number;
}

interface LabAppointment {
  _id: string;
  patient?: UserRef;
  lab?: UserRef;
  laboratoryService?: LabServiceRef;
  collectionType?: string;
  createdAt?: string;
  serviceFee?: number;
}

export type RevenueDetailsData = {
  paidDoctorAppointments: DoctorAppointment[];
  unpaidDoctorAppointments: DoctorAppointment[];
  paidLabAppointments: LabAppointment[];
  unpaidLabAppointments: LabAppointment[];
  totalDoctorRevenue: number;
  totalLabRevenue: number;
  upcomingDoctorRevenue: number;
  upcomingLabRevenue: number;
};

interface RevenueDetailsModalProps {
  open: boolean;
  onClose: () => void;
  revenueData: RevenueDetailsData;
  initialTab?: 'paid' | 'unpaid';
}

const RevenueDetailsModal: React.FC<RevenueDetailsModalProps> = ({ open, onClose, revenueData, initialTab = 'paid' }) => {
  const [activeTab, setActiveTab] = useState<'paid' | 'unpaid'>(initialTab);

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  if (!open) return null;

  const {
    paidDoctorAppointments = [],
    unpaidDoctorAppointments = [],
    paidLabAppointments = [],
    unpaidLabAppointments = [],
    totalDoctorRevenue = 0,
    totalLabRevenue = 0,
    upcomingDoctorRevenue = 0,
    upcomingLabRevenue = 0,
  } = revenueData || {};

  const renderTable = (appointments: (DoctorAppointment | LabAppointment)[], type: 'doctor' | 'lab') => (
    <table className="w-full text-sm mt-2 mb-6">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-3 py-2 text-left">Patient</th>
          <th className="px-3 py-2 text-left">{type === 'doctor' ? 'Doctor' : 'Lab'}</th>
          <th className="px-3 py-2 text-left">Amount</th>
          <th className="px-3 py-2 text-left">Type</th>
          <th className="px-3 py-2 text-left">Date</th>
        </tr>
      </thead>
      <tbody>
        {appointments.length === 0 && (
          <tr><td colSpan={5} className="text-center py-4 text-gray-400">No data</td></tr>
        )}
        {appointments.map((apt, idx) => (
          <tr key={apt._id || idx} className="border-b last:border-b-0">
            <td className="px-3 py-2">{apt.patient?.name || '-'}</td>
            <td className="px-3 py-2">{type === 'doctor' ? ((apt as DoctorAppointment).doctor?.name || '-') : ((apt as LabAppointment).lab?.name || '-')}</td>
            <td className="px-3 py-2 font-semibold">₹{type === 'doctor'
  ? ((apt as DoctorAppointment).consultationFee || 0)
  : ((apt as LabAppointment).serviceFee != null
      ? (apt as LabAppointment).serviceFee
      : ((apt as LabAppointment).laboratoryService?.price || 0))
}</td>
            <td className="px-3 py-2">{type === 'doctor' ? ((apt as DoctorAppointment).consultationType || '-') : ((apt as LabAppointment).collectionType || '-')}</td>
            <td className="px-3 py-2">{apt.createdAt ? new Date(apt.createdAt).toLocaleString() : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl font-light focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Revenue Details</h2>
          <div className="flex gap-4 mb-6">
            <button
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeTab === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('paid')}
            >Paid</button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeTab === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('unpaid')}
            >Unpaid</button>
          </div>
          {activeTab === 'paid' ? (
            <>
              <h3 className="text-lg font-semibold mb-2 text-green-700">Doctor Appointments (Paid)</h3>
              {renderTable(paidDoctorAppointments, 'doctor')}
              <div className="text-right font-bold text-green-700 mb-6">Total: ₹{totalDoctorRevenue.toLocaleString()}</div>
              <h3 className="text-lg font-semibold mb-2 text-green-700">Lab Appointments (Paid)</h3>
              {renderTable(paidLabAppointments, 'lab')}
              <div className="text-right font-bold text-green-700">Total: ₹{totalLabRevenue.toLocaleString()}</div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2 text-red-700">Doctor Appointments (Unpaid)</h3>
              {renderTable(unpaidDoctorAppointments, 'doctor')}
              <div className="text-right font-bold text-red-700 mb-6">Total: ₹{upcomingDoctorRevenue.toLocaleString()}</div>
              <h3 className="text-lg font-semibold mb-2 text-red-700">Lab Appointments (Unpaid)</h3>
              {renderTable(unpaidLabAppointments, 'lab')}
              <div className="text-right font-bold text-red-700">Total: ₹{upcomingLabRevenue.toLocaleString()}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueDetailsModal; 