import { useState, useEffect, useRef } from 'react';
import apiClient from '@/api/client';

interface Appointment {
  _id: string;
  status: string;
  doctor?: { _id: string; user?: { name: string } };
  laboratory?: { _id: string; laboratoryName?: string };
  laboratoryService?: { _id: string; name?: string };
  type?: 'doctor' | 'laboratory';
}

interface RatingModalData {
  appointmentId: string;
  providerId: string;
  providerName: string;
  providerType: 'doctor' | 'laboratoryService';
}

export const useRatingSystem = (appointments: Appointment[] = []) => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingModalData, setRatingModalData] = useState<RatingModalData | null>(null);
  const [hasCheckedForRatings, setHasCheckedForRatings] = useState(false);
  const appointmentsRef = useRef<string>('');

  // Check if user has already rated an appointment
  const checkAppointmentRating = async (appointmentId: string): Promise<{ hasRated: boolean; feedbackRequested: boolean }> => {
    try {
      const response = await apiClient.get(`/api/v1/ratings/appointments/${appointmentId}/check`);
      return {
        hasRated: response.data.hasRated || false,
        feedbackRequested: response.data.feedbackRequested || false
      };
    } catch (error) {
      console.error('Error checking appointment rating:', error);
      return { hasRated: false, feedbackRequested: false };
    }
  };

  // Check for completed appointments that need rating
  const checkForCompletedAppointments = async () => {
    if (hasCheckedForRatings || appointments.length === 0) {
      console.log('⏭️ Skipping rating check:', { hasCheckedForRatings, appointmentsLength: appointments.length });
      return;
    }
    
    console.log('🔍 Checking for completed appointments that need rating...');
    console.log('📊 Total appointments to check:', appointments.length);
    
      for (const appointment of appointments) {
      console.log(`🔍 Checking appointment ${appointment._id}:`, {
        status: appointment.status,
        hasDoctor: !!appointment.doctor,
        hasLaboratoryService: !!appointment.laboratoryService,
        hasLaboratory: !!appointment.laboratory,
        type: appointment.type,
        appointmentKeys: Object.keys(appointment),
        laboratoryServiceField: appointment.laboratoryService,
        fullAppointment: JSON.stringify(appointment, null, 2)
      });
      
      // Check for completed appointments (both 'completed' and 'marked-as-read' for lab tests)
      if (appointment.status !== 'completed' && appointment.status !== 'marked-as-read') {
        console.log(`⏭️ Skipping appointment ${appointment._id} - status: ${appointment.status}`);
        continue;
      }

      console.log(`✅ Found completed appointment: ${appointment._id} with status: ${appointment.status}`);

      // Check if user has already rated this appointment and if feedback has been requested
      console.log(`🔍 Checking rating status for appointment: ${appointment._id}`);
      const ratingCheck = await checkAppointmentRating(appointment._id);
      console.log(`📊 Rating check result for ${appointment._id}:`, ratingCheck);
      
      if (ratingCheck.hasRated) {
        console.log(`⏭️ User already rated appointment: ${appointment._id}`);
        continue;
      }

      if (!ratingCheck.feedbackRequested) {
        console.log(`⏭️ Feedback not yet requested for appointment: ${appointment._id}`);
        continue;
      }

      // Determine provider info based on appointment type
      let providerId: string | undefined;
      let providerName: string | undefined;
      let providerType: 'doctor' | 'laboratoryService' | undefined;

      if (appointment.doctor) {
        // For doctor appointments, use the profile ID if available, otherwise use the user ID
        const doctorProfileId = (appointment.doctor as any)?.profileId;
        providerId = doctorProfileId || appointment.doctor._id;
        providerName = appointment.doctor.user?.name || (appointment.doctor as any).name || 'Doctor';
        providerType = 'doctor';
        console.log(`🏥 Doctor appointment detected: ${providerName} (${providerId})`);
        console.log(`🔍 Doctor details:`, {
          userId: appointment.doctor._id,
          profileId: doctorProfileId,
          name: appointment.doctor.user?.name || (appointment.doctor as any).name
        });
      } else if (appointment.laboratoryService) {
        // For laboratory service appointments, rate the specific service
        providerId = appointment.laboratoryService._id;
        providerName = appointment.laboratoryService.name || 'Laboratory Service';
        providerType = 'laboratoryService';
        console.log(`🧪 Laboratory service appointment detected: ${providerName} (${providerId})`);
        console.log(`🔍 Laboratory service details:`, appointment.laboratoryService);
      } else if (appointment.type === 'laboratory') {
        // For laboratory appointments, we need to get the laboratoryService from the appointment
        // The appointment should have laboratoryService field populated
        console.log(`🔍 Laboratory appointment detected, checking for laboratoryService field...`);
        console.log(`📋 Appointment keys:`, Object.keys(appointment));
        
        // Try multiple ways to access laboratoryService from the appointment
        const labService = (appointment as any).laboratoryService;
        console.log(`🔍 Raw laboratoryService field:`, labService);
        console.log(`🔍 laboratoryService type:`, typeof labService);
        console.log(`🔍 laboratoryService keys:`, labService ? Object.keys(labService) : 'null/undefined');
        
        // Check if we have a valid laboratory service
        if (labService && labService._id) {
          providerId = labService._id;
          providerName = labService.name || 'Laboratory Service';
          providerType = 'laboratoryService';
          console.log(`🧪 Laboratory service found: ${providerName} (${providerId})`);
        } else {
          // Try to find laboratory service in other fields
          console.log(`⚠️ Could not find laboratoryService in appointment: ${appointment._id}`);
          console.log(`🔍 Available fields:`, Object.keys(appointment));
          console.log(`🔍 laboratoryService field:`, labService);
          console.log(`🔍 laboratoryService._id:`, labService?._id);
          console.log(`🔍 laboratoryService.name:`, labService?.name);
          
          // Try to find any field that might contain laboratory service info
          const appointmentAny = appointment as any;
          for (const key of Object.keys(appointmentAny)) {
            const value = appointmentAny[key];
            if (value && typeof value === 'object' && value._id && value.name) {
              console.log(`🔍 Found potential service in field ${key}:`, value);
              if (key.includes('service') || key.includes('laboratory')) {
                providerId = value._id;
                providerName = value.name;
                providerType = 'laboratoryService';
                console.log(`🧪 Found laboratory service in field ${key}: ${providerName} (${providerId})`);
                break;
              }
            }
          }
          
          if (!providerId) {
            console.log(`❌ No valid laboratory service found in appointment: ${appointment._id}`);
            console.log(`🔍 Cannot rate laboratory appointment without specific service - skipping`);
            continue;
          }
        }
      } else {
        console.log(`⚠️ Could not determine provider for appointment: ${appointment._id}`);
        continue;
      }

          // Check if we have all required provider info
          if (!providerId || !providerName || !providerType) {
            console.log(`❌ Missing provider info for appointment: ${appointment._id}`, {
              providerId,
              providerName,
              providerType
            });
            continue;
          }

          console.log(`🎯 Preparing rating modal for:`, {
            appointmentId: appointment._id,
            providerId,
        providerName,
        providerType
      });

      // Set modal data and show rating popup
            setRatingModalData({
              appointmentId: appointment._id,
              providerId,
        providerName,
        providerType
            });
            setShowRatingModal(true);
          console.log('🎉 Rating modal triggered successfully for:', providerName);
      
      // Only show one rating modal at a time
      break;
    }

    setHasCheckedForRatings(true);
  };

  // Handle rating submission
  const handleRatingSubmitted = () => {
    console.log('🎉 Rating submitted, closing modal');
    setShowRatingModal(false);
    setRatingModalData(null);
    // Don't reset hasCheckedForRatings immediately to prevent re-triggering
  };

  // Check for ratings when appointments change (but only if the appointments array actually changed)
  useEffect(() => {
    const appointmentsString = JSON.stringify(appointments.map(a => ({ id: a._id, status: a.status })));
    
    if (appointmentsRef.current !== appointmentsString) {
      console.log('🔄 Appointments changed, resetting rating check');
      appointmentsRef.current = appointmentsString;
      setHasCheckedForRatings(false);
    }
  }, [appointments]);

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
  };
}; 