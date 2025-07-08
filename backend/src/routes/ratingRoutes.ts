import express from 'express';
import { submitRating, getProviderRating, getUserRatingForAppointment, getAllRatings, markFeedbackRequested } from '../controllers/ratingController';
import { isAuthenticatedUser } from '../middlewares/auth';

const router = express.Router();

// Submit a rating (requires authentication)
router.post('/', isAuthenticatedUser, async (req, res, next) => {
  try {
    await submitRating(req, res);
  } catch (err) {
    next(err);
  }
});

// Mark feedback as requested (requires authentication)
router.post('/mark-feedback-requested', isAuthenticatedUser, async (req, res, next) => {
  try {
    await markFeedbackRequested(req, res);
  } catch (err) {
    next(err);
  }
});

// Get average rating for a profile (public)
router.get(
  '/profile/:profileId/:type',
  async (req, res, next) => {
    try {
      await getProviderRating(req, res);
    } catch (err) {
      next(err);
    }
  }
);

// Get user's rating for a specific appointment (requires authentication)
router.get(
  '/appointment/:appointmentId',
  isAuthenticatedUser,
  async (req, res, next) => {
    try {
      await getUserRatingForAppointment(req, res);
    } catch (err) {
      next(err);
    }
  }
);

// Test endpoint to get all ratings (for debugging)
router.get('/all', getAllRatings);

export default router; 