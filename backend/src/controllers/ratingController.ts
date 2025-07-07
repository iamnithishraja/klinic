import { Request, Response } from 'express';
import Rating from '../models/ratingModel';

// POST /api/v1/ratings/submit
export const submitRating = async (req: Request, res: Response) => {
  try {
    const { userId, appointmentId, type, providerId, rating, feedback } = req.body;
    if (!userId || !appointmentId || !type || !providerId || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Prevent duplicate rating for same appointment by same user
    const existing = await Rating.findOne({ userId, appointmentId });
    if (existing) {
      return res.status(409).json({ message: 'You have already rated this appointment.' });
    }
    const newRating = new Rating({ userId, appointmentId, type, providerId, rating, feedback });
    await newRating.save();
    res.status(201).json({ message: 'Rating submitted successfully', rating: newRating });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// GET /api/v1/ratings/provider/:providerId
export const getRatingsForProvider = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const ratings = await Rating.find({ providerId }).sort({ createdAt: -1 });
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// GET /api/v1/ratings/user/:userId
export const getUserRatings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const ratings = await Rating.find({ userId });
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}; 