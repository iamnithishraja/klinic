import { useState } from 'react';
import { UserRole } from '@/types/userTypes';
import { useUserStore } from '@/store/userStore';
import { useUserProfileStore, useDoctorProfileStore, useProfileUIStore } from '@/store/profileStore';
import apiClient from '@/api/client';
import { Address } from '@/types/profileTypes';

export const useProfileActions = () => {
  const { user, setUser } = useUserStore();
  const displayRole = user?.role || UserRole.USER;

  // User Profile Store
  const userProfileStore = useUserProfileStore();
  
  // Doctor Profile Store
  const doctorProfileStore = useDoctorProfileStore();
  
  // UI Store
  const uiStore = useProfileUIStore();
  
  // Fetch user data and profile
  const fetchUserData = async () => {
    try {
      uiStore.setLoading(true);
      
      // Try to get profile data
      try {
        console.log('Attempting to fetch profile data...');
        const profileResponse = await apiClient.get('/api/v1/profile');
        console.log('Profile data received:', profileResponse.data);
        
        // Handle new response format with profile and available data
        if (profileResponse.data && profileResponse.data.profile) {
          if (displayRole === UserRole.USER) {
            userProfileStore.updateFromApiResponse(profileResponse.data.profile);
          } else if (displayRole === UserRole.DOCTOR) {
            doctorProfileStore.updateFromApiResponse(profileResponse.data.profile);
          }
          
          // Set available cities
          if (profileResponse.data.avilableCities && 
              Array.isArray(profileResponse.data.avilableCities)) {
            uiStore.setCities(profileResponse.data.avilableCities);
          }
          
          // Set available specializations and qualifications for doctor profiles
          if (displayRole === UserRole.DOCTOR) {
            if (profileResponse.data.avilableSpecializations && 
                Array.isArray(profileResponse.data.avilableSpecializations)) {
              doctorProfileStore.setAvailableSpecializations(profileResponse.data.avilableSpecializations);
            }
            
            if (profileResponse.data.avilableQualifications && 
                Array.isArray(profileResponse.data.avilableQualifications)) {
              doctorProfileStore.setAvailableQualifications(profileResponse.data.avilableQualifications);
            }
          }
        } else {
          // Fallback to legacy format
          if (displayRole === UserRole.USER) {
            userProfileStore.updateFromApiResponse(profileResponse.data);
          } else if (displayRole === UserRole.DOCTOR) {
            doctorProfileStore.updateFromApiResponse(profileResponse.data);
          }
        }
      } catch (error: any) {
        console.log('Profile GET error:', error.response?.status, error.response?.data);
        
        // If 404, profile will be created when user saves
        if (error.response?.status === 404) {
          console.log('No profile found, will create one when user saves');
        }
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      // Error handling logic
    } finally {
      uiStore.setLoading(false);
    }
  };

  // Document pick handler for user profile
  const handleDocumentPick = async () => {
    try {
      uiStore.setUploadingPdf(true);
      
      // Logic for document picking - This would use DocumentPicker from expo
      // For example:
      // const result = await DocumentPicker.getDocumentAsync({...});
      
      // Simulate PDF upload (actual implementation would use your existing uploadFile function)
      // const s3Url = await uploadFileToS3(result);
      
      // Update PDF in store
      // userProfileStore.setMedicalHistoryPdf(s3Url);
      // userProfileStore.setSavedValues({...userProfileStore.savedValues, medicalHistoryPdf: s3Url});
      
      // Then update the profile
      // await handleUpdateUserProfile();
      
    } catch (error) {
      console.error('Error picking document:', error);
      alert('Failed to upload document');
    } finally {
      uiStore.setUploadingPdf(false);
    }
  };

  // Image picker for profile images
  const handleImagePick = () => {
    uiStore.setShowImageOptions(true);
  };

  // Save user profile
  const handleUpdateUserProfile = async () => {
    try {
      uiStore.setUpdating(true);
      
      // Prepare user profile data
      const profileData = {
        profilePicture: userProfileStore.profilePicture,
        age: userProfileStore.age ? parseInt(userProfileStore.age) : undefined,
        gender: userProfileStore.gender.toLowerCase(),
        medicalHistory: userProfileStore.medicalHistory,
        medicalHistoryPdf: userProfileStore.medicalHistoryPdf,
        address: {
          address: userProfileStore.address,
          pinCode: userProfileStore.pinCode,
          latitude: null,
          longitude: null
        } as Address,
        city: userProfileStore.city
      };
      
      console.log('Submitting user profile data:', JSON.stringify(profileData, null, 2));
      const response = await apiClient.post('/api/v1/user-profile', profileData);
      
      if (response.status === 200) {
        alert('Profile updated successfully');
        
        // Update saved values
        userProfileStore.setSavedValues({
          age: userProfileStore.age,
          gender: userProfileStore.gender,
          medicalHistory: userProfileStore.medicalHistory,
          address: userProfileStore.address,
          pinCode: userProfileStore.pinCode,
          city: userProfileStore.city,
          medicalHistoryPdf: userProfileStore.medicalHistoryPdf
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      uiStore.setUpdating(false);
    }
  };

  // Save doctor profile
  const handleUpdateDoctorProfile = async () => {
    try {
      uiStore.setUpdating(true);
      
      // Get prepared profile data from store
      const profileData = doctorProfileStore.prepareProfileData();
      
      console.log('Submitting doctor profile data:', JSON.stringify(profileData, null, 2));
      const response = await apiClient.post('/api/v1/doctor-profile', profileData);
      
      if (response.status === 200) {
        alert('Doctor profile updated successfully');
        
        // Update saved values to match current values
        doctorProfileStore.setSavedValues({
          description: doctorProfileStore.description,
          experience: doctorProfileStore.experience,
          specializations: doctorProfileStore.specializations,
          qualifications: doctorProfileStore.qualifications,
          consultationFee: doctorProfileStore.consultationFee,
          age: doctorProfileStore.age,
          gender: doctorProfileStore.gender,
          consultationType: doctorProfileStore.consultationType,
          coverImage: doctorProfileStore.coverImage,
          clinicName: doctorProfileStore.clinicName,
          clinicPhone: doctorProfileStore.clinicPhone,
          clinicEmail: doctorProfileStore.clinicEmail,
          clinicWebsite: doctorProfileStore.clinicWebsite,
          clinicAddress: doctorProfileStore.clinicAddress,
          clinicPinCode: doctorProfileStore.clinicPinCode,
          clinicCity: doctorProfileStore.clinicCity
        });
      }
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      alert('Failed to update doctor profile');
    } finally {
      uiStore.setUpdating(false);
    }
  };

  // User logout
  const handleLogout = async () => {
    try {
      // Logic for logging out
      console.log('User logged out');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    displayRole,
    fetchUserData,
    handleDocumentPick,
    handleImagePick,
    handleUpdateUserProfile,
    handleUpdateDoctorProfile,
    handleLogout,
    // Export stores for component access
    userProfileStore,
    doctorProfileStore,
    uiStore
  };
}; 