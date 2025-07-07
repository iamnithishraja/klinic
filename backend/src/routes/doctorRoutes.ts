import { Router } from 'express';
import { 
    getDoctorDashboard, 
    addPrescription, 
    deletePrescription,
    updatePaymentCollection,
    getAppointmentDetails, 
    updateAppointmentStatus,
    testDoctorEndpoint
} from '../controllers/doctorController';
import { isAuthenticatedUser, checkRole } from '../middlewares/auth';
import { UserRole } from '../types/userTypes';

const doctorRouter = Router();

// All routes require authentication and doctor role
doctorRouter.use(isAuthenticatedUser);
doctorRouter.use(async (req, res, next) => await checkRole(req, res, next, [UserRole.DOCTOR]));

// Test endpoint
doctorRouter.get('/test', testDoctorEndpoint);

// Dashboard
doctorRouter.get('/dashboard', getDoctorDashboard);

// Appointment management
doctorRouter.get('/appointments/:appointmentId', getAppointmentDetails);
doctorRouter.post('/appointments/:appointmentId/prescription', addPrescription);
doctorRouter.delete('/appointments/:appointmentId/prescription', deletePrescription);
doctorRouter.patch('/appointments/:appointmentId/payment-collection', updatePaymentCollection);
doctorRouter.patch('/appointments/:appointmentId/status', updateAppointmentStatus);

export default doctorRouter; 