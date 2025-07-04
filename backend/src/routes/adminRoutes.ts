import { Router } from 'express';
import { isAdmin, isAuthenticatedUser } from '../middlewares/auth';
import {
  getAllData,
  getProfileById,
  verifyProfileById,
  getUserProfileByUserId,
  getAllDoctorAppointments,
  getAllLabAppointments
} from '../controllers/adminController';

const adminRouter = Router();

// Unified data management - handles users, doctors, laboratories, delivery partners
adminRouter.get('/data', isAuthenticatedUser, isAdmin, getAllData);
adminRouter.get('/data/:id', isAuthenticatedUser, isAdmin, getProfileById);

// Individual item management
adminRouter.put('/profiles/:id/verify', isAuthenticatedUser, isAdmin, verifyProfileById);

// Get user profile by user ID (for admin)
adminRouter.get('/user-profile/by-user/:userId', isAuthenticatedUser, isAdmin, getUserProfileByUserId);

// Appointments endpoints for admin
adminRouter.get('/doctor-appointments', isAuthenticatedUser, isAdmin, getAllDoctorAppointments);
adminRouter.get('/lab-appointments', isAuthenticatedUser, isAdmin, getAllLabAppointments);

export default adminRouter; 