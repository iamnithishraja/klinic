import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Rating from '../models/ratingModel';
import type { CustomRequest } from '../types/userTypes';

// Submit or update a rating (upsert logic)
export const submitRating = async (req: CustomRequest, res: Response) => {
  try {
    const { appointmentId, providerId, providerType, rating, comment } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!appointmentId || !providerId || !providerType || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (providerType !== 'doctor' && providerType !== 'laboratoryService') {
      return res.status(400).json({ message: 'Provider type must be either doctor or laboratoryService' });
    }

    // Validate that the appointment exists and belongs to the user
    const DoctorAppointment = require('../models/doctorAppointments').default;
    const LabAppointment = require('../models/labAppointments').default;
    
    let appointment;
    if (providerType === 'doctor') {
      appointment = await DoctorAppointment.findById(appointmentId);
    } else if (providerType === 'laboratoryService') {
      appointment = await LabAppointment.findById(appointmentId);
    }
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if the appointment belongs to the current user (patient)
    if (appointment.patient?.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only rate your own appointments' });
    }

    // Check if appointment is completed
    // For laboratory appointments, check both 'completed' and 'marked-as-read' statuses
    if (providerType === 'doctor' && appointment.status !== 'completed') {
      return res.status(400).json({ message: 'You can only rate completed appointments' });
    } else if (providerType === 'laboratoryService' && appointment.status !== 'completed' && appointment.status !== 'marked-as-read') {
      return res.status(400).json({ message: 'You can only rate completed laboratory appointments' });
    }

    // Check if feedback has been requested for this appointment
    if (!appointment.feedbackRequested) {
      return res.status(400).json({ message: 'Rating not yet requested for this appointment' });
    }

    // Check if user has already rated this appointment
    const existingRating = await Rating.findOne({ userId, appointmentId });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this appointment' });
    }

    // Create rating
    const ratingData = {
      userId,
      appointmentId,
      providerId,
      providerType,
      rating,
      comment: comment?.trim() || undefined,
      mark: true
    };

    console.log('🔍 Creating rating with data:', ratingData);
    console.log('🔍 Appointment details for rating:', {
      appointmentId,
      providerId,
      providerType,
      appointmentStatus: appointment.status,
      appointmentLaboratoryService: appointment.laboratoryService
    });
    const newRating = await Rating.create(ratingData);
    console.log('✅ Rating created successfully:', newRating);

    // Mark feedback as completed in the appointment
    appointment.feedbackRequested = false; // Mark as completed
    await appointment.save();

    // Update provider's average rating
    await updateProviderRating(providerId, providerType);

    res.json({
      message: 'Rating submitted successfully',
      rating: newRating
    });

  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get provider ratings with breakdown (optimized with aggregation)
export const getProviderRatings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'doctor' or 'lab'

    console.log('🔍 getProviderRatings called with:', { id, type });

    if (!id || !type) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({ message: 'Provider ID and type are required' });
    }

    if (type !== 'doctor' && type !== 'laboratoryService') {
      console.log('❌ Invalid type:', type);
      return res.status(400).json({ message: 'Type must be either doctor or laboratoryService' });
    }

    const providerType = type as 'doctor' | 'laboratoryService';
    console.log('🔍 Provider type:', providerType);

    // Validate ObjectId
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
      console.log('✅ Valid ObjectId created:', objectId);
    } catch (err) {
      console.log('❌ Invalid ObjectId:', id, err);
      return res.json({
        averageRating: 0,
        totalRatings: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }

    console.log('🔍 Querying database with:', { providerId: objectId, providerType });

    // For doctors, we need to check both the profile ID and the user ID
    let matchConditions = [
      // New field structure
      { providerId: objectId, providerType: providerType },
      // Legacy field structure for doctors
      ...(providerType === 'doctor' ? [
        { doctorProfileId: objectId, type: 'doctor' },
        { doctorProfileId: objectId, type: 'laboratory' } // Some might be stored as laboratory type
      ] : [])
    ];

    console.log('🔍 Initial match conditions:', matchConditions);

    // For doctors, also check if ratings are stored with the user ID
    if (providerType === 'doctor') {
      try {
        // Get the doctor profile to find the user ID
        const { DoctorProfile } = require('../models/profileModel');
        const doctorProfile = await DoctorProfile.findById(objectId);
        
        if (doctorProfile && doctorProfile.user) {
          console.log('🔍 Found doctor profile, user ID:', doctorProfile.user);
          // Add conditions to check for ratings stored with user ID
          matchConditions.push(
            { providerId: doctorProfile.user, providerType: 'doctor' },
            { doctorProfileId: doctorProfile.user, type: 'doctor' },
            { doctorProfileId: doctorProfile.user, type: 'laboratory' }
          );
        }
      } catch (err) {
        const error = err as Error;
        console.log('⚠️ Could not fetch doctor profile:', error.message);
      }
    }



    // For laboratory services, check if ratings are stored with the service ID
    if (providerType === 'laboratoryService') {
      try {
        // For laboratory services, the providerId should be the service ID itself
        console.log('🔍 Checking laboratory service ratings for service ID:', objectId);
        
        // First, try to find the laboratory service to get the lab ID
        const LaboratoryService = require('../models/laboratoryServiceModel').default;
        const service = await LaboratoryService.findById(objectId);
        
        if (service) {
          console.log('🔍 Found laboratory service:', { id: service._id, name: service.name, lab: service.laboratory });
          // Only check for ratings stored with the specific service ID, not the lab ID
          // This prevents the same rating from appearing for all services from the same lab
          matchConditions.push(
            { providerId: objectId, providerType: 'laboratoryService' } as any,
            { laboratoryServiceId: objectId, type: 'laboratory' } as any
          );
        } else {
          console.log('⚠️ Laboratory service not found, using basic conditions');
          // Add basic conditions if service not found
        matchConditions.push(
            { providerId: objectId, providerType: 'laboratoryService' } as any,
            { laboratoryServiceId: objectId, type: 'laboratory' } as any
        );
        }
      } catch (err) {
        const error = err as Error;
        console.log('⚠️ Could not fetch laboratory service:', error.message);
      }
    }

    console.log('🔍 Final match conditions:', matchConditions);

    // First, let's check what ratings exist in the database
    const allRatings = await Rating.find({}).limit(10);
    console.log('🔍 All ratings in database (first 10):', allRatings.map(r => ({
      _id: r._id,
      providerId: r.providerId,
      providerType: r.providerType,
      rating: r.rating,
      appointmentId: r.appointmentId
    })));

    // Check if any ratings match our conditions
    const matchingRatings = await Rating.find({
      $or: matchConditions
    });
    console.log('🔍 Ratings matching our conditions:', matchingRatings.map(r => ({
      _id: r._id,
      providerId: r.providerId,
      providerType: r.providerType,
      rating: r.rating,
      appointmentId: r.appointmentId
    })));

    // Check specifically for the requested provider ID
    const specificProviderRatings = await Rating.find({
      providerId: objectId,
      providerType: providerType
    });
    console.log('🔍 Specific provider ratings:', specificProviderRatings.map(r => ({
      _id: r._id,
      providerId: r.providerId,
      providerType: r.providerType,
      rating: r.rating,
      appointmentId: r.appointmentId
    })));

    let result = await Rating.aggregate([
      {
        $match: {
          $or: matchConditions
        }
      },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          breakdown: {
            $push: '$rating'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalRatings: 1,
          averageRating: { $round: ['$averageRating', 1] },
          breakdown: 1
        }
      }
    ]);

    console.log('🔍 Comprehensive aggregation query executed');

    console.log('🔍 Aggregation result:', result);

    if (result.length === 0) {
      console.log('📭 No ratings found');
      return res.json({
        averageRating: 0,
        totalRatings: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }

    const { totalRatings, averageRating, breakdown } = result[0];

    // Calculate breakdown
    const breakdownCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdown.forEach((rating: number) => {
      breakdownCounts[rating as keyof typeof breakdownCounts]++;
    });

    const response = {
      averageRating,
      totalRatings,
      breakdown: breakdownCounts
    };

    console.log('✅ Sending response:', response);
    res.json(response);

  } catch (error: any) {
    console.error('❌ Error getting provider ratings:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if user has already rated an appointment
export const checkAppointmentRating = async (req: CustomRequest, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user?._id;

    console.log('🔍 checkAppointmentRating called for:', { appointmentId, userId });

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if appointment exists and feedback has been requested
    const DoctorAppointment = require('../models/doctorAppointments').default;
    const LabAppointment = require('../models/labAppointments').default;
    
    let appointment = await DoctorAppointment.findById(appointmentId);
    let appointmentType = 'doctor';
    if (!appointment) {
      appointment = await LabAppointment.findById(appointmentId);
      appointmentType = 'laboratory';
    }

    if (!appointment) {
      console.log('❌ Appointment not found:', appointmentId);
      return res.status(404).json({ message: 'Appointment not found' });
    }

    console.log('🔍 Appointment found:', {
      appointmentId,
      appointmentType,
      status: appointment?.status,
      feedbackRequested: appointment?.feedbackRequested,
      patient: appointment?.patient,
      userId
    });

    // For laboratory appointments, check both 'completed' and 'marked-as-read' statuses
    if (appointmentType === 'laboratory' && appointment?.status !== 'completed' && appointment?.status !== 'marked-as-read') {
      console.log('❌ Laboratory appointment not in completed state:', appointment?.status);
      return res.status(400).json({ message: 'You can only rate completed laboratory appointments' });
    }

    // Check if appointment belongs to user
    if (appointment.patient?.toString() !== userId.toString()) {
      console.log('❌ Access denied - appointment does not belong to user');
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if feedback has been requested
    if (!appointment.feedbackRequested) {
      console.log('⏭️ Feedback not requested for appointment:', appointmentId);
      return res.json({ 
        hasRated: false,
        feedbackRequested: false,
        message: 'Rating not yet requested for this appointment'
      });
    }

    const rating = await Rating.findOne({ userId, appointmentId });

    console.log('🔍 Rating check result:', {
      appointmentId,
      hasRating: !!rating,
      rating: rating ? {
        rating: rating.rating,
        comment: rating.comment,
        createdAt: rating.createdAt
      } : null
    });

    if (rating) {
      res.json({
        hasRated: true,
        feedbackRequested: true,
        rating: {
          rating: rating.rating,
          comment: rating.comment,
          createdAt: rating.createdAt
        }
      });
    } else {
      res.json({ 
        hasRated: false,
        feedbackRequested: true
      });
    }

  } catch (error) {
    console.error('Error checking appointment rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update provider's average rating in their profile
const updateProviderRating = async (providerId: string, providerType: 'doctor' | 'laboratoryService') => {
  try {
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(providerId);
    } catch (err) {
      console.error('Invalid ObjectId for provider:', providerId);
      return 0;
    }

    const result = await Rating.aggregate([
      {
        $match: {
          providerId: objectId,
          providerType: providerType
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const averageRating = result.length > 0 ? Math.round(result[0].averageRating * 10) / 10 : 0;

    // Update the provider's profile with the new average rating
    if (providerType === 'doctor') {
      const { DoctorProfile } = require('../models/profileModel');
      await DoctorProfile.findByIdAndUpdate(providerId, { rating: averageRating });
      console.log(`✅ Updated doctor profile ${providerId} with rating: ${averageRating}`);
    } else if (providerType === 'laboratoryService') {
      const LaboratoryService = require('../models/laboratoryServiceModel').default;
      console.log(`🔍 Updating laboratory service ${providerId} with rating: ${averageRating}`);
      const updatedService = await LaboratoryService.findByIdAndUpdate(providerId, { rating: averageRating });
      console.log(`✅ Updated laboratory service ${providerId} with rating: ${averageRating}`);
      console.log(`🔍 Updated service details:`, updatedService);
    }

    console.log(`Updated ${providerType} profile ${providerId} with rating: ${averageRating}`);
    return averageRating;
  } catch (error: any) {
    console.error('Error updating provider rating:', error);
    return 0;
  }
};

// Backward compatibility: Get average rating for a provider (old endpoint)
export const getProviderRating = async (req: Request, res: Response) => {
  try {
    const { profileId, type } = req.params;
    
    if (!profileId || !type) {
      return res.status(400).json({ message: 'Profile ID and type are required' });
    }

    if (type !== 'doctor' && type !== 'laboratory') {
      return res.status(400).json({ message: 'Type must be either doctor or laboratory' });
    }

    const providerType = type === 'doctor' ? 'doctor' : 'laboratoryService';
    let objectId;
    
    try {
      objectId = new mongoose.Types.ObjectId(profileId);
    } catch (err) {
      return res.json({ averageRating: 0, totalRatings: 0, ratings: [] });
    }

    // Use aggregation for better performance
    const result = await Rating.aggregate([
      {
        $match: {
          providerId: objectId,
          providerType: providerType
        }
      },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    if (result.length === 0) {
      return res.json({ averageRating: 0, totalRatings: 0, ratings: [] });
    }

    const { totalRatings, averageRating } = result[0];

    res.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
      ratings: []
    });

  } catch (error: any) {
    console.error('Error getting provider rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Test endpoint to get all ratings for debugging
export const getAllRatings = async (req: Request, res: Response) => {
  try {
    const ratings = await Rating.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    // Also get a count by provider type for debugging
    const doctorRatings = await Rating.find({ providerType: 'doctor' }).countDocuments();
    const laboratoryServiceRatings = await Rating.find({ providerType: 'laboratoryService' }).countDocuments();
    const legacyDoctorRatings = await Rating.find({ type: 'doctor' }).countDocuments();
    const legacyLabRatings = await Rating.find({ type: 'laboratory' }).countDocuments();
    
    // Get some sample appointments for debugging
    const DoctorAppointment = require('../models/doctorAppointments').default;
    const LabAppointment = require('../models/labAppointments').default;
    
    const sampleDoctorAppointments = await DoctorAppointment.find({ status: 'completed' }).limit(3);
    const sampleLabAppointments = await LabAppointment.find({ 
      status: { $in: ['completed', 'marked-as-read'] },
      feedbackRequested: true 
    }).limit(3);
    
    res.json({ 
      totalRatings: ratings.length,
      ratings,
      debug: {
        doctorRatings,
        laboratoryServiceRatings,
        legacyDoctorRatings,
        legacyLabRatings,
        sampleDoctorAppointments: sampleDoctorAppointments.map((apt: any) => ({
          _id: apt._id,
          status: apt.status,
          feedbackRequested: apt.feedbackRequested,
          patient: apt.patient
        })),
        sampleLabAppointments: sampleLabAppointments.map((apt: any) => ({
          _id: apt._id,
          status: apt.status,
          feedbackRequested: apt.feedbackRequested,
          patient: apt.patient,
          laboratoryService: apt.laboratoryService
        }))
      }
    });
  } catch (error: any) {
    console.error('Error getting all ratings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Debug endpoint to check ratings for a specific provider
export const debugProviderRatings = async (req: Request, res: Response) => {
  try {
    const { providerId, providerType } = req.params;
    
    if (!providerId || !providerType) {
      return res.status(400).json({ message: 'Provider ID and type are required' });
    }

    console.log('🔍 Debug request for:', { providerId, providerType });

    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(providerId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid provider ID format' });
    }

    // Check all possible field combinations
    const newFieldRatings = await Rating.find({ 
      providerId: objectId, 
      providerType: providerType 
    });

    const legacyDoctorRatings = await Rating.find({ 
      doctorProfileId: objectId, 
      type: 'doctor' 
    });

    const legacyLabRatings = await Rating.find({ 
      laboratoryServiceId: objectId, 
      type: 'laboratory' 
    });

    const allRatings = await Rating.find({
      $or: [
        { providerId: objectId },
        { doctorProfileId: objectId },
        { laboratoryServiceId: objectId }
      ]
    });

    res.json({
      providerId,
      providerType,
      newFieldRatings: {
        count: newFieldRatings.length,
        ratings: newFieldRatings
      },
      legacyDoctorRatings: {
        count: legacyDoctorRatings.length,
        ratings: legacyDoctorRatings
      },
      legacyLabRatings: {
        count: legacyLabRatings.length,
        ratings: legacyLabRatings
      },
      allRatingsForProvider: {
        count: allRatings.length,
        ratings: allRatings
      }
    });

  } catch (error: any) {
    console.error('Error debugging provider ratings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get appointments that need rating for the authenticated user
export const getAppointmentsNeedingRating = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get completed appointments for the user
    const DoctorAppointment = require('../models/doctorAppointments').default;
    const LabAppointment = require('../models/labAppointments').default;

    const completedDoctorAppointments = await DoctorAppointment.find({
      patient: userObjectId,
      status: 'completed',
      feedbackRequested: true
    })
    .populate('doctor', 'user')
    .populate('doctor.user', 'name')
    .sort({ updatedAt: -1 })
    .lean();

    const completedLabAppointments = await LabAppointment.find({
      patient: userObjectId,
      status: { $in: ['completed', 'marked-as-read'] },
      feedbackRequested: true
    })
    .populate('laboratoryService', 'name description coverImage')
    .populate('lab', 'laboratoryName')
    .sort({ updatedAt: -1 })
    .lean();

    // Get appointments that user has already rated
    const ratedAppointments = await Rating.find({
      userId: userObjectId
    }).distinct('appointmentId');

    // Filter out already rated appointments and format response
    const appointmentsNeedingRating = [
      ...completedDoctorAppointments
        .filter((appointment: any) => !ratedAppointments.includes(appointment._id))
        .map((appointment: any) => ({
          appointmentId: appointment._id.toString(),
          providerId: appointment.doctor._id.toString(),
          providerName: appointment.doctor.user?.name || 'Doctor',
          providerType: 'doctor' as const,
          appointmentDate: appointment.timeSlot,
          completedAt: appointment.updatedAt
        })),
      ...completedLabAppointments
        .filter((appointment: any) => !ratedAppointments.includes(appointment._id))
        .map((appointment: any) => {
          if (appointment.laboratoryService) {
            // For laboratory service appointments
            return {
              appointmentId: appointment._id.toString(),
              providerId: appointment.laboratoryService._id.toString(),
              providerName: appointment.laboratoryService.name || 'Laboratory Service',
              providerType: 'laboratoryService' as const,
              serviceDescription: appointment.laboratoryService.description,
              serviceImage: appointment.laboratoryService.coverImage,
              laboratoryName: appointment.lab?.laboratoryName || 'Unknown Laboratory',
              appointmentDate: appointment.timeSlot,
              completedAt: appointment.updatedAt
            };
          }
          // Remove laboratory appointments - only keep laboratory service appointments
          return null;
        })
        .filter(Boolean) // Remove null entries
    ];

    res.json({
      success: true,
      data: {
        appointmentsNeedingRating,
        totalCount: appointmentsNeedingRating.length
      }
    });

  } catch (error: any) {
    console.error('Error getting appointments needing rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get top rated services (doctors and laboratory services)
export const getTopRatedServices = async (req: Request, res: Response) => {
  try {
    const { limit = 10, type } = req.query;

    console.log('🔍 getTopRatedServices called with:', { limit, type });

    let matchCondition = {};
    if (type === 'doctor') {
      matchCondition = { providerType: 'doctor' };
    } else if (type === 'laboratoryService') {
      matchCondition = { providerType: 'laboratoryService' };
    }

    // Get top rated providers using aggregation
    const topRatedProviders = await Rating.aggregate([
      {
        $match: matchCondition
      },
      {
        $group: {
          _id: '$providerId',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          providerType: { $first: '$providerType' }
        }
      },
      {
        $match: {
          totalRatings: { $gte: 1 } // At least one rating
        }
      },
      {
        $sort: { averageRating: -1, totalRatings: -1 }
      },
      {
        $limit: Number(limit)
      }
    ]);

    // Populate provider details
    const populatedProviders = await Promise.all(
      topRatedProviders.map(async (provider) => {
        try {
          let providerDetails = null;

          if (provider.providerType === 'doctor') {
            const { DoctorProfile } = require('../models/profileModel');
            providerDetails = await DoctorProfile.findById(provider._id)
              .populate('user', 'name profilePicture')
              .lean();
          } else if (provider.providerType === 'laboratoryService') {
            const LaboratoryService = require('../models/laboratoryServiceModel').default;
            providerDetails = await LaboratoryService.findById(provider._id)
              .populate('laboratory', 'laboratoryName')
              .lean();
          }

          if (providerDetails) {
            return {
              _id: provider._id.toString(),
              providerType: provider.providerType,
              averageRating: Math.round(provider.averageRating * 10) / 10,
              totalRatings: provider.totalRatings,
              name: providerDetails.name || providerDetails.laboratoryName || 'Unknown',
              description: providerDetails.description,
              coverImage: providerDetails.coverImage || providerDetails.profilePicture,
              laboratoryName: providerDetails.laboratory?.laboratoryName
            };
          }
          return null;
        } catch (error) {
          console.error('Error populating provider details:', error);
          return null;
        }
      })
    );

    const validProviders = populatedProviders.filter(provider => provider !== null);

    res.json({
      success: true,
      data: {
        services: validProviders,
        totalCount: validProviders.length
      }
    });

  } catch (error: any) {
    console.error('Error getting top rated services:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Request feedback from patient (for doctors and laboratories)
export const requestFeedback = async (req: CustomRequest, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const providerId = req.user?._id;

    if (!providerId) {
      return res.status(401).json({ message: 'Provider not authenticated' });
    }

    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }

    // Check if appointment exists and belongs to this provider
    const DoctorAppointment = require('../models/doctorAppointments').default;
    const LabAppointment = require('../models/labAppointments').default;
    
    let appointment = await DoctorAppointment.findOne({
      _id: appointmentId,
      doctor: providerId
    });

    let appointmentType = 'doctor';
    if (!appointment) {
      appointment = await LabAppointment.findOne({
        _id: appointmentId,
        lab: providerId
      });
      appointmentType = 'laboratory';
    }

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or access denied' });
    }

    // Check if appointment is completed
    // For laboratory appointments, check both 'completed' and 'marked-as-read' statuses
    if (appointmentType === 'laboratory' && appointment.status !== 'completed' && appointment.status !== 'marked-as-read') {
      return res.status(400).json({ message: 'Can only request feedback for completed laboratory appointments' });
    } else if (appointmentType === 'doctor' && appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only request feedback for completed appointments' });
    }

    // Check if feedback has already been requested
    if (appointment.feedbackRequested) {
      return res.status(400).json({ message: 'Feedback has already been requested for this appointment' });
    }

    // Mark feedback as requested
    appointment.feedbackRequested = true;
    await appointment.save();

    res.json({
      message: 'Feedback request sent successfully',
      appointment: {
        _id: appointment._id,
        feedbackRequested: appointment.feedbackRequested,
        status: appointment.status
      }
    });

  } catch (error: any) {
    console.error('Error requesting feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cancel feedback request (for doctors and laboratories)
export const cancelFeedbackRequest = async (req: CustomRequest, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const providerId = req.user?._id;

    if (!providerId) {
      return res.status(401).json({ message: 'Provider not authenticated' });
    }

    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }

    // Check if appointment exists and belongs to this provider
    const DoctorAppointment = require('../models/doctorAppointments').default;
    const LabAppointment = require('../models/labAppointments').default;
    
    let appointment = await DoctorAppointment.findOne({
      _id: appointmentId,
      doctor: providerId
    });

    if (!appointment) {
      appointment = await LabAppointment.findOne({
        _id: appointmentId,
        lab: providerId
      });
    }

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or access denied' });
    }

    // Check if feedback has been requested
    if (!appointment.feedbackRequested) {
      return res.status(400).json({ message: 'No feedback request to cancel' });
    }

    // Check if user has already rated
    const existingRating = await Rating.findOne({ appointmentId });
    if (existingRating) {
      return res.status(400).json({ message: 'Cannot cancel feedback request - user has already rated' });
    }

    // Cancel feedback request
    appointment.feedbackRequested = false;
    await appointment.save();

    res.json({
      message: 'Feedback request cancelled successfully',
      appointment: {
        _id: appointment._id,
        feedbackRequested: appointment.feedbackRequested,
        status: appointment.status
      }
    });

  } catch (error: any) {
    console.error('Error cancelling feedback request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 