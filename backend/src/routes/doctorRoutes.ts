import { Router } from 'express';
import { 
    getDoctorDashboard, 
    addPrescription, 
    deletePrescription,
    getAppointmentDetails, 
    updateAppointmentStatus,
    testDoctorEndpoint,
    getDoctorAvailability,
    cancelAppointment
} from '../controllers/doctorController';
import { isAuthenticatedUser, checkRole } from '../middlewares/auth';
import { UserRole } from '../types/userTypes';

const doctorRouter = Router();

// All routes require authentication and doctor role
doctorRouter.use(isAuthenticatedUser);

// Test endpoint
doctorRouter.get('/test', testDoctorEndpoint);

// Dashboard
doctorRouter.get('/dashboard', getDoctorDashboard);

// Appointment management
doctorRouter.get('/appointments/:appointmentId', getAppointmentDetails);
doctorRouter.put('/appointments/:appointmentId/status', updateAppointmentStatus);
doctorRouter.delete('/appointments/:appointmentId', cancelAppointment);

// Availability
doctorRouter.get('/:doctorId/availability', getDoctorAvailability);

export default doctorRouter; 