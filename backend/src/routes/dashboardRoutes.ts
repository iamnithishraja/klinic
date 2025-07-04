import { Router } from "express";
import { 
    getUserDashboard, 
    getPreviousAppointments, 
    getPreviousLabTests, 
    getAppointmentPrescription, 
    getLabReport 
} from "../controllers/dashboardController";
import { isAuthenticatedUser } from "../middlewares/auth";

const router = Router();

// Get user dashboard with upcoming appointments
router.get('/dashboard', isAuthenticatedUser, getUserDashboard);

// Get previous appointments with pagination
router.get('/appointments/previous', isAuthenticatedUser, getPreviousAppointments);

// Get previous lab tests with pagination
router.get('/lab-tests/previous', isAuthenticatedUser, getPreviousLabTests);

// Get prescription for a specific appointment
router.get('/appointments/:appointmentId/prescription', isAuthenticatedUser, getAppointmentPrescription);

// Get lab report for a specific test
router.get('/lab-tests/:testId/report', isAuthenticatedUser, getLabReport);

export default router; 