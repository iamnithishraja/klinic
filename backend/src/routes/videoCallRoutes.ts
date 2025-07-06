import express from 'express';
import { generateVideoCallToken, endVideoCall, getVideoCallHistory } from '../controllers/videoCallController';
import { isAuthenticatedUser } from '../middlewares/auth';

const router = express.Router();

// Generate video call token
router.post('/generate-token', isAuthenticatedUser, generateVideoCallToken);

// End video call
router.post('/end-call', isAuthenticatedUser, endVideoCall);

// Get video call history
router.get('/history', isAuthenticatedUser, getVideoCallHistory);

export default router; 