import { Router } from 'express';
import { 
    getLaboratoryDashboard, 
    addLabReport, 
    getAppointmentDetails, 
    updateAppointmentStatus,
    getLaboratoryServices,
    testLaboratoryEndpoint,
    markAsRead
} from '../controllers/laboratoryController';
import { isAuthenticatedUser, checkRole } from '../middlewares/auth';
import { UserRole } from '../types/userTypes';

const laboratoryRouter = Router();

// All routes require authentication and laboratory role
laboratoryRouter.use(isAuthenticatedUser);
laboratoryRouter.use(async (req, res, next) => await checkRole(req, res, next, [UserRole.LABORATORY]));

// Test endpoint
laboratoryRouter.get('/test', testLaboratoryEndpoint);

// Dashboard
laboratoryRouter.get('/dashboard', getLaboratoryDashboard);

// Services
laboratoryRouter.get('/services', getLaboratoryServices);

// Appointment management
laboratoryRouter.get('/appointments/:appointmentId', getAppointmentDetails);
laboratoryRouter.post('/appointments/:appointmentId/report', addLabReport);
laboratoryRouter.patch('/appointments/:appointmentId/status', updateAppointmentStatus);
laboratoryRouter.patch('/appointments/:appointmentId/mark-as-read', markAsRead);

export default laboratoryRouter; 