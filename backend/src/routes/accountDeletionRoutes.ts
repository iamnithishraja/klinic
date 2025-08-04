import express from 'express';
import { isAuthenticatedUser } from '../middlewares/auth';
import {
    requestAccountDeletion,
    deleteAccount,
    cancelDeletionRequest,
    getDeletionStatus
} from '../controllers/accountDeletionController';

const router = express.Router();

// Request account deletion
router.post('/request', isAuthenticatedUser, requestAccountDeletion);

// Delete account (confirm deletion)
router.delete('/confirm', isAuthenticatedUser, deleteAccount);

// Cancel deletion request
router.delete('/cancel', isAuthenticatedUser, cancelDeletionRequest);

// Get deletion status
router.get('/status', isAuthenticatedUser, getDeletionStatus);

export default router; 