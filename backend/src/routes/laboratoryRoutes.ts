import { Router } from 'express';
import { 
    getLaboratoryDashboard, 
    addLabReport, 
    deleteLabReport,
    getAppointmentDetails, 
    updateAppointmentStatus,
    getLaboratoryServices,
    testLaboratoryEndpoint,
    markAsRead,
    markSampleCollected,
    getLaboratoryAvailability
} from '../controllers/laboratoryController';
import { isAuthenticatedUser, checkRole } from '../middlewares/auth';
import { UserRole } from '../types/userTypes';

const laboratoryRouter = Router();

// All routes require authentication and laboratory role
laboratoryRouter.use(isAuthenticatedUser);

// Test endpoint
laboratoryRouter.get('/test', testLaboratoryEndpoint);

// Dashboard
laboratoryRouter.get('/dashboard', getLaboratoryDashboard);

// Services
laboratoryRouter.get('/services', getLaboratoryServices);

// Appointment management
laboratoryRouter.get('/appointments/:appointmentId', getAppointmentDetails);
laboratoryRouter.post('/appointments/:appointmentId/report', addLabReport);
laboratoryRouter.delete('/appointments/:appointmentId/report', deleteLabReport);
laboratoryRouter.patch('/appointments/:appointmentId/status', updateAppointmentStatus);
laboratoryRouter.patch('/appointments/:appointmentId/mark-as-read', markAsRead);
laboratoryRouter.patch('/appointments/:appointmentId/sample-collected', markSampleCollected);

// Availability
laboratoryRouter.get('/:laboratoryId/availability', getLaboratoryAvailability);

export default laboratoryRouter; 