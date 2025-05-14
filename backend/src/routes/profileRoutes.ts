import { Router } from 'express';
import {
    createUpdateUserProfile,
    getProfile,
    createUpdateDoctorProfile,
    getUploadUrl
} from '../controllers/profileController';
import { isAuthenticatedUser, checkRole } from '../middlewares/auth';
import { UserRole } from '../types/userTypes';

const profileRouter = Router();

// Profile management routes
profileRouter.post('/user-profile', isAuthenticatedUser, createUpdateUserProfile);
profileRouter.post('/doctor-profile', isAuthenticatedUser, (req, res, next) =>
    checkRole(req, res, next, [UserRole.DOCTOR, UserRole.ADMIN])
    , createUpdateDoctorProfile);

// Get profile based on user role
profileRouter.get('/profile', isAuthenticatedUser, getProfile);

// File upload URL generation
profileRouter.post('/upload-url', isAuthenticatedUser, getUploadUrl);

export default profileRouter; 