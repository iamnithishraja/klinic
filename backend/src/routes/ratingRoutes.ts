import { Router } from 'express';
import { submitRating, getRatingsForProvider, getUserRatings } from '../controllers/ratingController';

const router = Router();

// POST /api/v1/ratings/submit
router.post('/submit', submitRating);

// GET /api/v1/ratings/provider/:providerId
router.get('/provider/:providerId', getRatingsForProvider);

// GET /api/v1/ratings/user/:userId
router.get('/user/:userId', getUserRatings);

export default router; 