import { useState, useEffect } from 'react';
import apiClient from '@/api/client';

interface Appointment {
  _id: string;
  type: 'doctor' | 'laboratory';
  status: string;
  prescription?: string;
  reportResult?: string;
  feedbackRequested?: boolean;
  doctor?: {
    profileId?: string;
    _id: string;
  };
  lab?: {
    profileId?: string;
    _id: string;
  };
  providerName: string;
}

interface RatingModalData {
  appointmentId: string;
  providerId: string;
  providerName: string;
  type: 'doctor' | 'laboratory';
}

export const useRatingSystem = (appointments: Appointment[] = []) => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingModalData, setRatingModalData] = useState<RatingModalData | null>(null);
  const [hasCheckedForRatings, setHasCheckedForRatings] = useState(false);
  const [processedAppointments, setProcessedAppointments] = useState<Set<string>>(new Set());

  // Mark feedback as requested in the database
  const markFeedbackRequested = async (appointmentId: string, type: 'doctor' | 'laboratory') => {
    try {
      console.log('🔄 Marking feedback as requested for:', { appointmentId, type });
      const response = await apiClient.post('/api/v1/ratings/mark-feedback-requested', {
        appointmentId,
        type
      });
      console.log('✅ Feedback marked successfully:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Error marking feedback as requested:', error.response?.data || error.message);
      return false;
    }
  };

  // Check for completed appointments that need rating
  const checkForCompletedAppointments = async () => {
    if (hasCheckedForRatings || appointments.length === 0) {
      console.log('⏭️ Skipping rating check:', { hasCheckedForRatings, appointmentsLength: appointments.length });
      return;
    }
    
    console.log('🔍 Checking for completed appointments:', appointments.length);
    
    try {
      // Find completed appointments that haven't had feedback requested
      for (const appointment of appointments) {
        console.log(`🏥 Checking appointment ${appointment._id}:`, {
          type: appointment.type,
          status: appointment.status,
          prescription: appointment.prescription,
          reportResult: appointment.reportResult,
          feedbackRequested: appointment.feedbackRequested,
          providerName: appointment.providerName
        });

        // More strict criteria for completed appointments
        let isCompleted = false;
        
        if (appointment.type === 'doctor') {
          // Doctor appointment is completed if status is 'completed' AND has meaningful prescription content
          const prescription = appointment.prescription?.trim() || '';
          isCompleted = appointment.status === 'completed' && 
                       prescription !== '' && 
                       prescription.toLowerCase() !== 'no' &&
                       prescription.toLowerCase() !== 'null';
        } else if (appointment.type === 'laboratory') {
          // Lab appointment is completed if status is 'completed' AND has meaningful report content
          const reportResult = appointment.reportResult?.trim() || '';
          isCompleted = appointment.status === 'completed' && 
                       reportResult !== '' && 
                       reportResult.toLowerCase() !== 'no' &&
                       reportResult.toLowerCase() !== 'null';
        }

        console.log(`📊 Appointment ${appointment._id} completion check:`, { isCompleted });
          
        // Check if feedback was already requested for this appointment or if we've already processed it
        if (isCompleted && !appointment.feedbackRequested && !processedAppointments.has(appointment._id)) {
          console.log(`✅ Found valid appointment for rating: ${appointment._id}`);
          
          const appointmentType = appointment.type === 'doctor' ? 'doctor' : 'laboratory';
          
          // Get provider ID
          const providerId = appointment.type === 'doctor' 
            ? appointment.doctor?.profileId || appointment.doctor?._id
            : appointment.lab?.profileId || appointment.lab?._id;

          if (!providerId) {
            console.error(`❌ No provider ID found for appointment ${appointment._id}`);
            continue;
          }

          console.log(`🎯 Preparing rating modal for:`, {
            appointmentId: appointment._id,
            providerId,
            providerName: appointment.providerName,
            type: appointmentType
          });
          
          // Mark feedback as requested in the database
          const marked = await markFeedbackRequested(appointment._id, appointmentType);
          
          if (marked) {
            // Add to processed appointments to prevent re-triggering
            setProcessedAppointments(prev => new Set([...prev, appointment._id]));
            
            setRatingModalData({
              appointmentId: appointment._id,
              providerId,
              providerName: appointment.providerName,
              type: appointmentType
            });
            setShowRatingModal(true);
            console.log('🎉 Rating modal triggered successfully');
            break; // Only show one at a time
          } else {
            console.error(`❌ Failed to mark feedback as requested for ${appointment._id}`);
          }
        } else {
          console.log(`⏭️ Skipping appointment ${appointment._id}:`, {
            isCompleted,
            feedbackRequested: appointment.feedbackRequested,
            alreadyProcessed: processedAppointments.has(appointment._id)
          });
        }
      }
    } catch (error) {
      console.error('💥 Error checking for completed appointments:', error);
    } finally {
      setHasCheckedForRatings(true);
      console.log('🎯 Finished checking appointments');
    }
  };

  // Handle rating submission
  const handleRatingSubmitted = () => {
    console.log('🎉 Rating submitted, closing modal');
    setShowRatingModal(false);
    setRatingModalData(null);
    // Don't reset hasCheckedForRatings immediately to prevent re-triggering
    // It will be reset when new appointments come in
  };

  // Check for ratings when appointments change
  useEffect(() => {
    if (appointments.length > 0) {
      // Reset the check flag when appointments actually change
      setHasCheckedForRatings(false);
    }
  }, [appointments.length]);

  useEffect(() => {
    if (appointments.length > 0 && !hasCheckedForRatings) {
      console.log('🚀 Triggering rating check from useEffect');
      checkForCompletedAppointments();
    }
  }, [appointments, hasCheckedForRatings]);

  return {
    showRatingModal,
    ratingModalData,
    handleRatingSubmitted,
    checkForCompletedAppointments
  };
}; 