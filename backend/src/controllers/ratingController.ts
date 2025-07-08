import type { Request, Response } from 'express';
import Rating from '../models/ratingModel';
import type { CustomRequest } from '../types/userTypes';

// Function to update profile ratings
const updateProfileRating = async (providerId: string, type: 'doctor' | 'laboratory') => {
  try {
    const { DoctorProfile, LaboratoryProfile } = require('../models/profileModel');
    
    // Get all ratings for this provider
    const ratings = await Rating.find({ providerId, type });
    
    if (ratings.length === 0) {
      // No ratings, set to default values
      const updateData = { rating: 0 };
      
      if (type === 'doctor') {
        await DoctorProfile.findByIdAndUpdate(providerId, updateData);
      } else {
        await LaboratoryProfile.findByIdAndUpdate(providerId, updateData);
      }
      return 0; // Return 0 as the average rating
    }
    
    // Calculate new average and total
    const totalRating = ratings.reduce((sum: number, rating) => sum + rating.rating, 0);
    const averageRating = Math.round((totalRating / ratings.length) * 10) / 10;
    
    const updateData = { rating: averageRating };
    
    // Update the appropriate profile
    if (type === 'doctor') {
      await DoctorProfile.findByIdAndUpdate(providerId, updateData);
    } else {
      await LaboratoryProfile.findByIdAndUpdate(providerId, updateData);
    }
    
    console.log(`Updated ${type} profile ${providerId} with rating: ${averageRating}`);
    return averageRating; // Return the calculated average
  } catch (error: any) {
    console.error('Error updating profile rating:', error);
    return 0;
  }
};

// Submit a rating
export const submitRating = async (req: CustomRequest, res: Response) => {
  try {
    const { appointmentId, providerId, type, rating, feedback } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!appointmentId || !providerId || !type || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (type !== 'doctor' && type !== 'laboratory') {
      return res.status(400).json({ message: 'Type must be either doctor or laboratory' });
    }

    // Check if user has already rated this appointment
    const existingRating = await Rating.findOne({
      userId,
      appointmentId
    });

    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this appointment' });
    }

    // Validate that the appointment exists and belongs to the correct provider
    const DoctorAppointment = require('../models/doctorAppointments').default;
    const LabAppointment = require('../models/labAppointments').default;
    
    let appointment;
    if (type === 'doctor') {
      appointment = await DoctorAppointment.findById(appointmentId);
    } else {
      appointment = await LabAppointment.findById(appointmentId);
    }
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // For doctor appointments, check if the doctor ID matches
    if (type === 'doctor' && appointment.doctor?.toString() !== providerId) {
      return res.status(400).json({ message: 'Appointment does not belong to this doctor' });
    }

    // For laboratory appointments, check if the laboratory ID matches
    if (type === 'laboratory' && appointment.lab?.toString() !== providerId) {
      return res.status(400).json({ message: 'Appointment does not belong to this laboratory' });
    }

    // In submitRating, ensure mark is set to true when a rating is submitted
    const ratingData = {
      ...req.body,
      mark: true // Always set mark true on submit
    };

    // Create new rating
    const newRating = new Rating({
      userId,
      providerId, // This should be the doctor/laboratory profile ID, not user ID
      appointmentId,
      type,
      rating,
      feedback: feedback?.trim() || undefined
    });

    await newRating.save();

    // Update profile ratings after a new rating is submitted
    const averageRating = await updateProfileRating(providerId, type);

    res.json({
      averageRating
    });

  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get average rating for a provider
export const getProviderRating = async (req: Request, res: Response) => {
  try {
    const { providerId, type } = req.params;

    console.log('getProviderRating - Starting with params:', { providerId, type });

    if (!providerId || !type) {
      return res.status(400).json({ message: 'Provider ID and type are required' });
    }

    if (type !== 'doctor' && type !== 'laboratory') {
      return res.status(400).json({ message: 'Type must be either doctor or laboratory' });
    }

    // First try to find ratings with the provided providerId
    let ratings = await Rating.find({
      providerId,
      type
    });

    console.log('getProviderRating - Found ratings with providerId:', ratings.length);

    // If no ratings found, try to find ratings by user ID (for backward compatibility)
    if (ratings.length === 0) {
      console.log('getProviderRating - No ratings found, trying to find by user ID');
      
      try {
        // Import the Profile models to find the user ID
        const { DoctorProfile, LaboratoryProfile } = require('../models/profileModel');
        
        let user;
        if (type === 'doctor') {
          user = await DoctorProfile.findById(providerId).populate('user');
          console.log('getProviderRating - Doctor profile found:', !!user);
        } else {
          user = await LaboratoryProfile.findById(providerId).populate('user');
          console.log('getProviderRating - Laboratory profile found:', !!user);
        }
        
        if (user && user.user) {
          console.log('getProviderRating - User ID found:', user.user._id);
          ratings = await Rating.find({
            providerId: user.user._id,
            type
          });
          console.log('getProviderRating - Found ratings with user ID:', ratings.length);
        } else {
          console.log('getProviderRating - No user found in profile');
        }
      } catch (profileError) {
        console.error('getProviderRating - Error finding profile:', profileError);
      }
    }

    console.log('getProviderRating - Total ratings found:', ratings.length);

    if (ratings.length === 0) {
      return res.json({
        averageRating: 0,
        ratings: []
      });
    }

    const totalRating = ratings.reduce((sum: number, rating) => sum + rating.rating, 0);
    const averageRating = Math.round((totalRating / ratings.length) * 10) / 10; // Round to 1 decimal

    console.log('getProviderRating - Calculated rating:', { averageRating, totalRatings: ratings.length });

    // Update profile ratings to keep them in sync
    await updateProfileRating(providerId, type);

    res.json({
      averageRating,
      ratings: ratings.map(rating => ({
        rating: rating.rating,
        feedback: rating.feedback,
        createdAt: rating.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Error getting provider rating:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's rating for a specific appointment
export const getUserRatingForAppointment = async (req: CustomRequest, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const rating = await Rating.findOne({
      userId,
      appointmentId
    });

    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    res.json({ rating });

  } catch (error) {
    console.error('Error getting user rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Test endpoint to get all ratings for debugging
export const getAllRatings = async (req: Request, res: Response) => {
  try {
    const ratings = await Rating.find({}).populate('userId', 'name').populate('providerId', 'name');
    
    // Group ratings by provider and type
    const ratingsByProvider = ratings.reduce((acc, rating) => {
      const key = `${rating.providerId}_${rating.type}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(rating);
      return acc;
    }, {} as any);
    
    res.json({ 
      ratings
    });
  } catch (error: any) {
    console.error('Error getting all ratings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 