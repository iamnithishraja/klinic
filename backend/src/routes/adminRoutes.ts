import { Router } from 'express';
import { isAdmin, isAuthenticatedUser } from '../middlewares/auth';
import {
  getAllData,
  getProfileById,
  verifyProfileById,
  unverifyProfileById,
  getUserProfileByUserId,
  getAllDoctorAppointments,
  getAllLabAppointments,
  updateUserRole,
  getAllUsersWithRoles,
  removeAdminRole,
  getRevenueOverview,
  getSystemNotifications,
  getRecentActivityFeed,
  suspendUser,
  unsuspendUser,
  getUserSuspensionStatus,
  getAllSuspensions,
  getRevenueDetails,
  rejectDoctorProfile,
  getAppointmentTrends
} from '../controllers/adminController';

const adminRouter = Router();

// Unified data management - handles users, doctors, laboratories, delivery partners
adminRouter.get('/data', isAuthenticatedUser, isAdmin, getAllData);
adminRouter.get('/data/:id', isAuthenticatedUser, isAdmin, getProfileById);

// Individual item management
adminRouter.put('/profiles/:id/verify', isAuthenticatedUser, isAdmin, verifyProfileById);
adminRouter.put('/profiles/:id/unverify', isAuthenticatedUser, isAdmin, unverifyProfileById);
adminRouter.put('/profiles/:id/reject', isAuthenticatedUser, isAdmin, rejectDoctorProfile);

// Get user profile by user ID (for admin)
adminRouter.get('/user-profile/by-user/:userId', isAuthenticatedUser, isAdmin, getUserProfileByUserId);

// Appointments endpoints for admin
adminRouter.get('/doctor-appointments', isAuthenticatedUser, isAdmin, getAllDoctorAppointments);
adminRouter.get('/lab-appointments', isAuthenticatedUser, isAdmin, getAllLabAppointments);

// Role management endpoints
adminRouter.get('/users/roles', isAuthenticatedUser, isAdmin, getAllUsersWithRoles);
adminRouter.put('/users/:userId/role', isAuthenticatedUser, isAdmin, updateUserRole);
adminRouter.delete('/users/:userId/admin-role', isAuthenticatedUser, isAdmin, removeAdminRole);

// --- Admin Dashboard new endpoints ---
adminRouter.get('/revenue-overview', isAuthenticatedUser, isAdmin, getRevenueOverview);
adminRouter.get('/revenue-details', isAuthenticatedUser, isAdmin, getRevenueDetails);
adminRouter.get('/notifications', isAuthenticatedUser, isAdmin, getSystemNotifications);
adminRouter.get('/activity-feed', isAuthenticatedUser, isAdmin, getRecentActivityFeed);

// User suspension routes
adminRouter.post('/users/suspend', isAuthenticatedUser, isAdmin, suspendUser);
adminRouter.put('/users/:userId/unsuspend', isAuthenticatedUser, isAdmin, unsuspendUser);
adminRouter.get('/users/:userId/suspension-status', isAuthenticatedUser, isAdmin, getUserSuspensionStatus);
adminRouter.get('/suspensions', isAuthenticatedUser, isAdmin, getAllSuspensions);

export default adminRouter; 