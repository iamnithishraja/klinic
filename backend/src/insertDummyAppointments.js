const mongoose = require('mongoose');
require('dotenv').config();
const { connectDatabse } = require('./config/database');
const DoctorAppointments = require('./models/doctorAppointments').default;
const LabAppointments = require('./models/labAppointments').default;

// Replace these with real ObjectIds from your DB for real testing
const doctorId = new mongoose.Types.ObjectId();
const patientId = new mongoose.Types.ObjectId();
const clinicId = new mongoose.Types.ObjectId();
const labId = new mongoose.Types.ObjectId();
const serviceId = new mongoose.Types.ObjectId();

async function insertDummyAppointments() {
  await connectDatabse();

  // Dummy doctor appointments
  const doctorAppointments = [
    {
      doctor: doctorId,
      patient: patientId,
      clinic: clinicId,
      timeSlot: '2024-06-01T10:00:00Z',
      consultationType: 'in-person',
      prescription: 'Take 1 tablet daily',
      status: 'upcoming',
      isPaid: true,
      paymentId: 'pay_123',
      paymentOrderId: 'order_123',
      paymentStatus: 'captured',
      notes: 'First visit',
    },
    {
      doctor: doctorId,
      patient: patientId,
      clinic: clinicId,
      timeSlot: '2024-06-02T14:00:00Z',
      consultationType: 'online',
      prescription: null,
      status: 'completed',
      isPaid: false,
      paymentId: null,
      paymentOrderId: null,
      paymentStatus: 'pending',
      notes: 'Follow-up',
    },
  ];

  // Dummy lab appointments
  const labAppointments = [
    {
      lab: labId,
      patient: patientId,
      laboratoryService: serviceId,
      selectedTests: [1, 2],
      timeSlot: '2024-06-03T09:00:00Z',
      collectionType: 'lab',
      status: 'upcoming',
      isPaid: true,
      paymentId: 'pay_456',
      paymentOrderId: 'order_456',
      paymentStatus: 'captured',
      reportResult: null,
    },
    {
      lab: labId,
      patient: patientId,
      laboratoryService: serviceId,
      selectedTests: [3],
      timeSlot: '2024-06-04T11:00:00Z',
      collectionType: 'home',
      status: 'completed',
      isPaid: false,
      paymentId: null,
      paymentOrderId: null,
      paymentStatus: 'pending',
      reportResult: 'All tests normal',
    },
  ];

  await DoctorAppointments.insertMany(doctorAppointments);
  await LabAppointments.insertMany(labAppointments);

  console.log('Dummy appointments inserted!');
  process.exit(0);
}

insertDummyAppointments().catch((err) => {
  console.error(err);
  process.exit(1);
}); 