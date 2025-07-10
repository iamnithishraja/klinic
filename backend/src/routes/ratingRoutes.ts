import express from 'express';
import mongoose from 'mongoose';
import { 
  submitRating, 
  getProviderRatings, 
  checkAppointmentRating, 
  getProviderRating, 
  getAllRatings,
  debugProviderRatings,
  getAppointmentsNeedingRating,
  getTopRatedServices,
  requestFeedback,
  cancelFeedbackRequest
} from '../controllers/ratingController';
import { isAuthenticatedUser } from '../middlewares/auth';
import Rating from '../models/ratingModel'; // Added import for Rating model

const router = express.Router();

// Submit or update a rating (requires authentication)
router.post('/', isAuthenticatedUser, async (req, res, next) => {
  try {
    await submitRating(req, res);
  } catch (err) {
    next(err);
  }
});

// Get provider ratings with breakdown (public)
// Supports: /api/v1/ratings/providers/:id?type=doctor|lab|laboratoryService
router.get('/providers/:id', async (req, res, next) => {
  try {
    await getProviderRatings(req, res);
  } catch (err) {
    next(err);
  }
});

// Check if user has rated an appointment (requires authentication)
router.get('/appointments/:appointmentId/check', isAuthenticatedUser, async (req, res, next) => {
  try {
    await checkAppointmentRating(req, res);
  } catch (err) {
    next(err);
  }
});

// Backward compatibility: Get average rating for a profile (public)
router.get('/profile/:profileId/:type', async (req, res, next) => {
    try {
      await getProviderRating(req, res);
    } catch (err) {
      next(err);
    }
});

// Test endpoint to get all ratings for debugging
router.get('/all', getAllRatings);

// Debug endpoint to check ratings for a specific provider
router.get('/debug/:providerId/:providerType', debugProviderRatings);

// Get appointments that need rating (requires authentication)
router.get('/appointments/needing-rating', isAuthenticatedUser, async (req, res, next) => {
  try {
    await getAppointmentsNeedingRating(req, res);
  } catch (err) {
    next(err);
  }
});

// Get top rated services (public)
router.get('/top-rated', async (req, res, next) => {
  try {
    await getTopRatedServices(req, res);
  } catch (err) {
    next(err);
  }
});

// Request feedback from patient (requires authentication - for doctors and laboratories)
router.post('/appointments/:appointmentId/request-feedback', isAuthenticatedUser, async (req, res, next) => {
  try {
    await requestFeedback(req, res);
  } catch (err) {
    next(err);
  }
});

// Cancel feedback request (requires authentication - for doctors and laboratories)
router.delete('/appointments/:appointmentId/cancel-feedback', isAuthenticatedUser, async (req, res, next) => {
  try {
    await cancelFeedbackRequest(req, res);
  } catch (err) {
    next(err);
  }
});

// Get laboratory service ratings specifically
router.get('/laboratory-services/:serviceId', async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const result = await Rating.aggregate([
      {
        $match: {
          $or: [
            { providerId: new mongoose.Types.ObjectId(serviceId), providerType: 'laboratoryService' },
            { laboratoryServiceId: new mongoose.Types.ObjectId(serviceId) }
          ]
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
      }
    ]);

    if (result.length === 0) {
      return res.json({
        averageRating: 0,
        totalRatings: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }

    const { totalRatings, averageRating, breakdown } = result[0];
    
    // Calculate rating breakdown
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdown.forEach((rating: number) => {
      if (ratingBreakdown[rating as keyof typeof ratingBreakdown] !== undefined) {
        ratingBreakdown[rating as keyof typeof ratingBreakdown]++;
      }
    });

    res.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
      breakdown: ratingBreakdown
    });
  } catch (err) {
    next(err);
  }
});

// Simple test endpoint to check database connection
router.get('/test', async (req, res) => {
  try {
    const count = await Rating.countDocuments();
    const allRatings = await Rating.find({}).limit(5);
    res.json({ 
      message: 'Database connection successful',
      totalRatings: count,
      ratings: allRatings.map(r => ({
        _id: r._id,
        providerId: r.providerId,
        providerType: r.providerType,
        rating: r.rating,
        appointmentId: r.appointmentId,
        createdAt: r.createdAt
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Debug endpoint to check specific service ratings
router.get('/debug-service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    // Check ratings for this specific service
    const ratings = await Rating.find({
      providerId: serviceId,
      providerType: 'laboratoryService'
    });
    
    // Also check legacy fields
    const legacyRatings = await Rating.find({
      laboratoryServiceId: serviceId
    });
    
    res.json({
      serviceId,
      ratings: ratings.map(r => ({
        _id: r._id,
        providerId: r.providerId,
        providerType: r.providerType,
        rating: r.rating,
        comment: r.comment,
        appointmentId: r.appointmentId,
        createdAt: r.createdAt
      })),
      legacyRatings: legacyRatings.map(r => ({
        _id: r._id,
        providerId: r.providerId,
        providerType: r.providerType,
        rating: r.rating,
        comment: r.comment,
        appointmentId: r.appointmentId,
        createdAt: r.createdAt
      })),
      totalRatings: ratings.length,
      totalLegacyRatings: legacyRatings.length
    });
  } catch (error) {
    console.error('Error debugging service ratings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Debug endpoint to check appointment provider ID
router.get('/debug-appointment/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // Check both doctor and lab appointments
    const DoctorAppointment = require('../models/doctorAppointments').default;
    const LabAppointment = require('../models/labAppointments').default;
    
    let appointment = await DoctorAppointment.findById(appointmentId);
    let appointmentType = 'doctor';
    
    if (!appointment) {
      appointment = await LabAppointment.findById(appointmentId).populate('laboratoryService');
      appointmentType = 'laboratory';
    }
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    let providerInfo = null;
    
    if (appointmentType === 'doctor') {
      providerInfo = {
        providerId: appointment.doctor,
        providerType: 'doctor',
        providerName: appointment.doctor?.user?.name || 'Doctor'
      };
    } else {
      providerInfo = {
        providerId: appointment.laboratoryService?._id,
        providerType: 'laboratoryService',
        providerName: appointment.laboratoryService?.name || 'Laboratory Service'
      };
    }
    
    res.json({
      appointmentId,
      appointmentType,
      status: appointment.status,
      feedbackRequested: appointment.feedbackRequested,
      providerInfo,
      appointment: {
        _id: appointment._id,
        status: appointment.status,
        laboratoryService: appointment.laboratoryService,
        doctor: appointment.doctor
      }
    });
  } catch (error) {
    console.error('Error debugging appointment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Rating service is running',
    timestamp: new Date().toISOString()
  });
});

export default router; 