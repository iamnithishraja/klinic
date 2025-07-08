import type { Request, Response } from 'express';
import Rating from '../models/ratingModel';
import type { CustomRequest } from '../types/userTypes';

// Function to update profile ratings
const updateProfileRating = async (profileId: string, type: 'doctor' | 'laboratory') => {
  try {
    const { DoctorProfile } = require('../models/profileModel');
    const LaboratoryService = require('../models/laboratoryServiceModel').default;
    
    let ratings;
    if (type === 'doctor') {
      // Get all ratings for this doctor profile
      ratings = await Rating.find({ doctorProfileId: profileId, type });
    } else {
      // Get all ratings for this laboratory service
      ratings = await Rating.find({ laboratoryServiceId: profileId, type });
    }
    
    if (ratings.length === 0) {
      // No ratings, set to default values
      const updateData = { rating: 0 };
      
      if (type === 'doctor') {
        await DoctorProfile.findByIdAndUpdate(profileId, updateData);
      } else {
        await LaboratoryService.findByIdAndUpdate(profileId, updateData);
      }
      return 0; // Return 0 as the average rating
    }
    
    // Calculate new average and total
    const totalRating = ratings.reduce((sum: number, rating) => sum + rating.rating, 0);
    const averageRating = Math.round((totalRating / ratings.length) * 10) / 10;
    
    const updateData = { rating: averageRating };
    
    // Update the appropriate profile/service
    if (type === 'doctor') {
      await DoctorProfile.findByIdAndUpdate(profileId, updateData);
    } else {
      await LaboratoryService.findByIdAndUpdate(profileId, updateData);
    }
    
    console.log(`Updated ${type} profile ${profileId} with rating: ${averageRating}`);
    return averageRating; // Return the calculated average
  } catch (error: any) {
    console.error('Error updating profile rating:', error);
    return 0;
  }
};

// Submit a rating
export const submitRating = async (req: CustomRequest, res: Response) => {
  try {
    const { appointmentId, profileId, type, rating, feedback } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!appointmentId || !profileId || !type || !rating) {
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

    // Validate that the appointment exists and belongs to the user
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

    // Check if the appointment belongs to the current user (patient)
    if (appointment.patient?.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only rate your own appointments' });
    }

    // Create new rating with proper fields
    const ratingData: any = {
      userId,
      appointmentId,
      type,
      rating,
      feedback: feedback?.trim() || undefined,
      mark: true
    };

    if (type === 'doctor') {
      ratingData.doctorProfileId = profileId;
    } else {
      ratingData.laboratoryServiceId = profileId;
    }

    const newRating = new Rating(ratingData);
    await newRating.save();

    // Update profile ratings after a new rating is submitted
    const averageRating = await updateProfileRating(profileId, type);

    res.json({
      message: 'Rating submitted successfully',
      averageRating
    });

  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark feedback as requested for an appointment
export const markFeedbackRequested = async (req: CustomRequest, res: Response) => {
  try {
    const { appointmentId, type } = req.body;
    
    if (!appointmentId || !type) {
      return res.status(400).json({ message: 'Appointment ID and type are required' });
    }

    if (type !== 'doctor' && type !== 'laboratory') {
      return res.status(400).json({ message: 'Type must be either doctor or laboratory' });
    }

    const DoctorAppointment = require('../models/doctorAppointments').default;
    const LabAppointment = require('../models/labAppointments').default;
    
    let appointment;
    let updateResult;
    
    if (type === 'doctor') {
      updateResult = await DoctorAppointment.findByIdAndUpdate(
        appointmentId,
        { feedbackRequested: true },
        { new: true }
      );
    } else {
      updateResult = await LabAppointment.findByIdAndUpdate(
        appointmentId,
        { feedbackRequested: true },
        { new: true }
      );
    }
    
    if (!updateResult) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ 
      message: 'Feedback request marked successfully',
      appointmentId,
      feedbackRequested: true
    });

  } catch (error) {
    console.error('Error marking feedback request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get average rating for a provider
export const getProviderRating = async (req: Request, res: Response) => {
  try {
    const { profileId, type } = req.params;

    console.log('=== RATING QUERY DEBUG ===');
    console.log('Requested profileId:', profileId);
    console.log('Requested type:', type);

    if (!profileId || !type) {
      return res.status(400).json({ message: 'Profile ID and type are required' });
    }

    if (type !== 'doctor' && type !== 'laboratory') {
      return res.status(400).json({ message: 'Type must be either doctor or laboratory' });
    }

    // First, let's see what's actually in the database
    const allRatings = await Rating.find({});
    console.log('Total ratings in database:', allRatings.length);
    
    if (allRatings.length > 0) {
      console.log('Sample ratings in database:');
      allRatings.slice(0, 3).forEach((rating, index) => {
        console.log(`Rating ${index + 1}:`, {
          _id: rating._id,
          userId: rating.userId,
          doctorProfileId: rating.doctorProfileId,
          laboratoryServiceId: rating.laboratoryServiceId,
          type: rating.type,
          rating: rating.rating,
          appointmentId: rating.appointmentId
        });
      });
    }

    let ratings = [];
    
    if (type === 'doctor') {
      console.log('Searching for doctor ratings...');
      console.log('Query: { doctorProfileId:', profileId, ', type: "doctor" }');
      
      // Direct query first
      ratings = await Rating.find({ 
        doctorProfileId: profileId, 
        type: 'doctor' 
      });
      
      console.log('Direct query result:', ratings.length);
      
      // If no results, try with ObjectId conversion
      if (ratings.length === 0) {
        console.log('Trying with ObjectId conversion...');
        try {
          const mongoose = require('mongoose');
          const objectId = new mongoose.Types.ObjectId(profileId);
          ratings = await Rating.find({ 
            doctorProfileId: objectId, 
            type: 'doctor' 
          });
          console.log('ObjectId query result:', ratings.length);
                 } catch (err: any) {
           console.log('ObjectId conversion failed:', err.message);
         }
      }
      
      // If still no results, let's see what doctor ratings exist
      if (ratings.length === 0) {
        console.log('No doctor ratings found. Checking all doctor type ratings...');
        const allDoctorRatings = await Rating.find({ type: 'doctor' });
        console.log('Total doctor ratings in database:', allDoctorRatings.length);
        
        if (allDoctorRatings.length > 0) {
          console.log('Available doctor profile IDs in ratings:');
          allDoctorRatings.forEach((rating, index) => {
            console.log(`Doctor rating ${index + 1} - doctorProfileId:`, rating.doctorProfileId, 'type:', typeof rating.doctorProfileId);
          });
          
          // Check if any of these match our query (as string comparison)
          const matchingRating = allDoctorRatings.find(r => 
            r.doctorProfileId && r.doctorProfileId.toString() === profileId.toString()
          );
          console.log('Found matching rating by string comparison:', !!matchingRating);
        }
      }
      
    } else {
      console.log('Searching for laboratory ratings...');
      ratings = await Rating.find({ 
        laboratoryServiceId: profileId, 
        type: 'laboratory' 
      });
      console.log('Lab service ratings found:', ratings.length);
    }

    console.log('Final ratings found:', ratings.length);
    
    if (ratings.length > 0) {
      console.log('Rating details:');
      ratings.forEach((rating, index) => {
        console.log(`Rating ${index + 1}:`, {
          rating: rating.rating,
          feedback: rating.feedback,
          createdAt: rating.createdAt
        });
      });
    }

    if (ratings.length === 0) {
      console.log('=== NO RATINGS FOUND ===');
      return res.json({
        averageRating: 0,
        totalRatings: 0,
        ratings: []
      });
    }

    const totalRating = ratings.reduce((sum: number, rating) => sum + rating.rating, 0);
    const averageRating = Math.round((totalRating / ratings.length) * 10) / 10;

    console.log('Calculated total rating:', totalRating);
    console.log('Calculated average rating:', averageRating);
    console.log('=== RATING QUERY COMPLETE ===');

    res.json({
      averageRating,
      totalRatings: ratings.length,
      ratings: ratings.map(rating => ({
        rating: rating.rating,
        feedback: rating.feedback,
        createdAt: rating.createdAt
      }))
    });

  } catch (error: any) {
    console.error('❌ Error getting provider rating:', error);
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
    const ratings = await Rating.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    // Group ratings by provider and type for analysis
    const ratingsByProvider = ratings.reduce((acc, rating) => {
      const profileId = rating.doctorProfileId || rating.laboratoryServiceId;
      const key = `${profileId}_${rating.type}`;
      if (!acc[key]) {
        acc[key] = {
          profileId: profileId,
          type: rating.type,
          ratings: [],
          totalRatings: 0,
          averageRating: 0
        };
      }
      acc[key].ratings.push(rating);
      acc[key].totalRatings++;
      return acc;
    }, {} as any);
    
    // Calculate averages for each provider
    Object.keys(ratingsByProvider).forEach(key => {
      const provider = ratingsByProvider[key];
      const total = provider.ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
      provider.averageRating = Math.round((total / provider.totalRatings) * 10) / 10;
    });
    
    res.json({ 
      totalRatings: ratings.length,
      ratings,
      ratingsByProvider: Object.values(ratingsByProvider)
    });
  } catch (error: any) {
    console.error('Error getting all ratings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 