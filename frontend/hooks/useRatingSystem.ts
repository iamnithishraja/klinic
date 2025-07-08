import { useState, useEffect } from 'react';
import apiClient from '@/api/client';

interface Appointment {
  _id: string;
  type: 'doctor' | 'lab';
  status: string;
  prescription?: string;
  reportResult?: string;
  doctor?: any;
  lab?: any;
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

  // Check if user has rated this appointment and if mark is true
  const checkIfRatedOrMarked = async (appointmentId: string): Promise<boolean> => {
    try {
      const res = await apiClient.get(`/api/v1/ratings/appointment/${appointmentId}`);
      // If mark is true, treat as rated/marked
      return res.data.rating?.mark === true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false; // No rating exists
      }
      // For other errors, assume not rated/marked to be safe
      return false;
    }
  };

  // Check for completed appointments that need rating
  const checkForCompletedAppointments = async () => {
    if (hasCheckedForRatings || appointments.length === 0) return;
    try {
      // Find completed appointments that haven't been rated or marked
      for (const appointment of appointments) {
        const isCompleted = appointment.type === 'doctor' 
          ? appointment.status === 'completed' && appointment.prescription
          : appointment.status === 'completed' && appointment.reportResult;
        if (isCompleted) {
          const isMarked = await checkIfRatedOrMarked(appointment._id);
          if (!isMarked) {
            setRatingModalData({
              appointmentId: appointment._id,
              providerId: appointment.type === 'doctor' 
                ? appointment.doctor?.profileId || appointment.doctor?._id
                : appointment.lab?.profileId || appointment.lab?._id,
              providerName: appointment.providerName,
              type: appointment.type === 'doctor' ? 'doctor' : 'laboratory'
            });
            setShowRatingModal(true);
            break; // Only show one at a time
          }
        }
      }
    } catch (error) {
      console.error('Error checking for completed appointments:', error);
    } finally {
      setHasCheckedForRatings(true);
    }
  };

  // Handle rating submission
  const handleRatingSubmitted = () => {
    setShowRatingModal(false);
    setRatingModalData(null);
    // Optionally refresh appointments or mark as rated
  };

  // Check for ratings when appointments change
  useEffect(() => {
    if (appointments.length > 0 && !hasCheckedForRatings) {
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