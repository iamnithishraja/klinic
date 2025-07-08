import { Router } from "express";
import { 
    getUserDashboard, 
    getPreviousAppointments, 
    getPreviousLabTests, 
    getAppointmentPrescription, 
    getLabReport,
    getLabReportPdfs,
    getLabNotes,
    getCollectedSamples
} from "../controllers/dashboardController";
import { isAuthenticatedUser } from "../middlewares/auth";

const router = Router();

// Get user dashboard with upcoming appointments
router.get('/dashboard', isAuthenticatedUser, getUserDashboard);

// Get previous appointments with pagination
router.get('/appointments/previous', isAuthenticatedUser, getPreviousAppointments);

// Get previous lab tests with pagination
router.get('/lab-tests/previous', isAuthenticatedUser, getPreviousLabTests);

// Get collected samples (lab appointments with collected status)
router.get('/lab-tests/collected', isAuthenticatedUser, getCollectedSamples);

// Get prescription for a specific appointment
router.get('/appointments/:appointmentId/prescription', isAuthenticatedUser, getAppointmentPrescription);

// Get lab report for a specific test
router.get('/lab-tests/:testId/report', isAuthenticatedUser, getLabReport);

// Get lab report PDFs for a specific test
router.get('/lab-tests/:testId/pdfs', isAuthenticatedUser, getLabReportPdfs);

// Get lab notes for a specific test
router.get('/lab-tests/:testId/notes', isAuthenticatedUser, getLabNotes);

export default router; 