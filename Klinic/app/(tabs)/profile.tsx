import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Text, ScrollView, View, Platform, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';

import { store } from '@/utils';
import { UserRole } from '@/types/userTypes';
import { UserData, UserProfile, ProfileUpdateData, Address, DoctorProfile } from '@/types/profileTypes';
import { useUserStore } from '@/store/userStore';
import { useUserProfileStore, useDoctorProfileStore, useProfileUIStore } from '@/store/profileStore';
import useProfileApi from '@/hooks/useProfileApi';
import apiClient from '@/api/client';

// Import modular components
import ProfileHeader from '@/components/profile/ProfileHeader';
import UserProfileForm from '@/components/profile/UserProfileForm';
import DoctorProfileForm from '@/components/profile/DoctorProfileForm';
import LaboratoryProfileForm from '@/components/profile/LaboratoryProfileForm';
import DeliveryProfileForm from '@/components/profile/DeliveryProfileForm';
import SaveButton from '@/components/profile/SaveButton';
import ImagePickerModal from '@/components/profile/ImagePickerModal';

const Profile = () => {
  const router = useRouter();
  const { user, setUser } = useUserStore();

  // Use Zustand stores directly
  const userProfileStore = useUserProfileStore();
  const doctorProfileStore = useDoctorProfileStore();
  const uiStore = useProfileUIStore();

  // Local state for UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  // For tracking file picks
  const [cameraCaptureUri, setCameraCaptureUri] = useState<string | null>(null);
  const [galleryCaptureUri, setGalleryCaptureUri] = useState<string | null>(null);

  // Custom hooks for API calls
  const userApi = useProfileApi({
    endpoint: '/api/v1/user',
    onSuccess: (data) => {
      // Save to store for persistent data
      useUserStore.getState().setUser(data);
    }
  });

  const profileApi = useProfileApi({
    endpoint: '/api/v1/profile'
  });

  // Create API hooks for updating profiles
  const userProfileApi = useProfileApi({
    endpoint: '/api/v1/user-profile'
  });

  const doctorProfileApi = useProfileApi({
    endpoint: '/api/v1/doctor-profile'
  });

  // Setup keyboard listener
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // Don't adjust anything, just track the keyboard height
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  useEffect(() => {
    // Fetch user data when component mounts
    fetchUserData();
  }, []);

  // Fetch user data and profile
  const fetchUserData = async () => {
    try {
      uiStore.setLoading(true);

      // Try to get user data from API
      await userApi.fetchData();

      // Try to get profile data
      try {
        console.log('Attempting to fetch profile data...');
        const profileData = await profileApi.fetchData();
        console.log('Profile data received:', JSON.stringify(profileData, null, 2));

        // Handle new response format with profile and available data
        if (profileData && profileData.profile) {
          if (user?.role === UserRole.USER) {
            userProfileStore.updateFromApiResponse(profileData.profile);
          } else if (user?.role === UserRole.DOCTOR) {
            doctorProfileStore.updateFromApiResponse(profileData.profile);
            
            // Log doctor profile state after update
            console.log('Doctor profile state after API update:', {
              specializations: doctorProfileStore.specializations,
              qualifications: doctorProfileStore.qualifications,
              isAvailable: doctorProfileStore.isAvailable
            });
          }

          // Set available cities
          if (profileData.availableCities &&
            Array.isArray(profileData.availableCities)) {
            setFilteredCities(profileData.availableCities);
            uiStore.setCities(profileData.availableCities);
            console.log(`Loaded ${profileData.availableCities.length} cities`);
          } else if (profileData.avilableCities &&
            Array.isArray(profileData.avilableCities)) {
            // Fallback to misspelled key if necessary
            setFilteredCities(profileData.avilableCities);
            uiStore.setCities(profileData.avilableCities);
            console.log(`Loaded ${profileData.avilableCities.length} cities (from misspelled key)`);
          } else {
            console.warn('No cities found in API response');
          }

          // Set available specializations and qualifications for doctor profiles
          if (user?.role === UserRole.DOCTOR) {
            if (profileData.availableSpecializations &&
              Array.isArray(profileData.availableSpecializations)) {
              doctorProfileStore.setAvailableSpecializations(profileData.availableSpecializations);
              console.log(`Loaded ${profileData.availableSpecializations.length} available specializations:`, profileData.availableSpecializations);
            } else if (profileData.avilableSpecializations &&
              Array.isArray(profileData.avilableSpecializations)) {
              // Fallback to misspelled key if necessary
              doctorProfileStore.setAvailableSpecializations(profileData.avilableSpecializations);
              console.log(`Loaded ${profileData.avilableSpecializations.length} available specializations (from misspelled key):`, profileData.avilableSpecializations);
            } else {
              console.warn('No available specializations found in API response');
              // Set some defaults if none are provided
              const defaultSpecializations = ["Cardiologist", "Dermatologist", "Pediatrician", "Neurologist", "Orthopedic Surgeon"];
              doctorProfileStore.setAvailableSpecializations(defaultSpecializations);
              console.log('Using default specializations:', defaultSpecializations);
            }

            if (profileData.availableQualifications &&
              Array.isArray(profileData.availableQualifications)) {
              doctorProfileStore.setAvailableQualifications(profileData.availableQualifications);
              console.log(`Loaded ${profileData.availableQualifications.length} available qualifications:`, profileData.availableQualifications);
            } else if (profileData.avilableQualifications &&
              Array.isArray(profileData.avilableQualifications)) {
              // Fallback to misspelled key if necessary
              doctorProfileStore.setAvailableQualifications(profileData.avilableQualifications);
              console.log(`Loaded ${profileData.avilableQualifications.length} available qualifications (from misspelled key):`, profileData.avilableQualifications);
            } else {
              console.warn('No available qualifications found in API response');
              // Set some defaults if none are provided
              const defaultQualifications = ["MBBS", "MD", "MS", "DM"];
              doctorProfileStore.setAvailableQualifications(defaultQualifications);
              console.log('Using default qualifications:', defaultQualifications);
            }
          }
        } else {
          // Fallback to legacy format
          if (user?.role === UserRole.USER) {
            userProfileStore.updateFromApiResponse(profileData);
          } else if (user?.role === UserRole.DOCTOR) {
            doctorProfileStore.updateFromApiResponse(profileData);
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
    } finally {
      uiStore.setLoading(false);
    }
  };

  // User logout
  const handleLogout = async () => {
    try {
      // Logic for logging out
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Image picker handlers
  const openCamera = async () => {
    try {
      uiStore.setUploadingImage(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCameraCaptureUri(result.assets[0].uri);
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Failed to take photo');
    } finally {
      uiStore.setUploadingImage(false);
      uiStore.setUploadingCoverImage(false);
      uiStore.setShowImageOptions(false);
    }
  };

  const openGallery = async () => {
    try {
      uiStore.setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setGalleryCaptureUri(result.assets[0].uri);
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    } finally {
      uiStore.setUploadingImage(false);
      uiStore.setUploadingCoverImage(false);
      uiStore.setShowImageOptions(false);
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      console.log('Uploading image from:', imageUri);

      // Determine file details
      const fileName = `profile-image-${Date.now()}.jpg`;
      const fileType = 'image/jpeg';

      // Use the appropriate API hook based on user role
      let imageUrl = null;
      if (user?.role === UserRole.USER) {
        imageUrl = await userProfileApi.uploadFile(fileType, fileName, imageUri);
      } else if (user?.role === UserRole.DOCTOR) {
        imageUrl = await doctorProfileApi.uploadFile(fileType, fileName, imageUri);
      }

      if (imageUrl) {
        console.log('Image uploaded successfully, URL:', imageUrl);

        // Update state with the new image URL
        if (user?.role === UserRole.USER) {
          userProfileStore.setProfilePicture(imageUrl);
        } else if (user?.role === UserRole.DOCTOR) {
          doctorProfileStore.setCoverImage(imageUrl);
        }
      } else {
        console.error('Failed to get URL for the uploaded image');
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  // Document pick handler for user profile
  const handleDocumentPick = async () => {
    try {
      uiStore.setUploadingPdf(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        // Get the file information
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name || `medical-history-${Date.now()}.pdf`;
        const fileType = result.assets[0].mimeType || 'application/pdf';

        console.log('Document selected:', fileUri);

        // Use the uploadFile method from userProfileApi to get a public URL
        const pdfUrl = await userProfileApi.uploadFile(fileType, fileName, fileUri);

        if (pdfUrl) {
          console.log('PDF uploaded successfully, URL:', pdfUrl);

          // Update PDF in store
          userProfileStore.setMedicalHistoryPdf(pdfUrl);

          // Auto-save the PDF change
          const profileData = {
            profilePicture: userProfileStore.profilePicture,
            age: userProfileStore.age ? parseInt(userProfileStore.age) : undefined,
            gender: userProfileStore.gender.toLowerCase(),
            medicalHistory: userProfileStore.medicalHistory,
            medicalHistoryPdf: pdfUrl,
            address: {
              address: userProfileStore.address,
              pinCode: userProfileStore.pinCode,
              latitude: null,
              longitude: null
            } as Address,
            city: userProfileStore.city
          };

          console.log('Auto-saving PDF upload...');
          const success = await userProfileApi.updateDataSilent(profileData);

          if (success) {
            console.log('PDF update saved successfully');
            // Update saved values
            userProfileStore.setSavedValues({
              ...userProfileStore.savedValues,
              medicalHistoryPdf: pdfUrl
            });

            // Notify user of successful upload
            alert('Medical history PDF uploaded successfully.');
          } else {
            alert('PDF uploaded but failed to save. Please try saving manually.');
          }
        } else {
          console.error('Failed to get URL for the uploaded PDF');
          alert('Failed to upload PDF file');
        }
      }
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

  // Handle cover image pick for doctor profile
  const handleCoverImagePick = async () => {
    try {
      uiStore.setUploadingCoverImage(true);
      handleImagePick();
    } catch (error) {
      console.error('Error setting up cover image pick:', error);
    } finally {
      // Note: actual uploading will happen in openCamera or openGallery functions
      // which will call uploadImage, so we don't set uploadingCoverImage to false here
    }
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
      const response = await userProfileApi.updateData(profileData);

      if (response) {
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

  // Handle doctor isAvailable toggle with immediate save
  const handleDoctorIsAvailableChange = async (newIsAvailable: boolean) => {
    try {
      // Set the availability status in store
      doctorProfileStore.setIsAvailable(newIsAvailable);

      // Prepare profile data
      const profileData = doctorProfileStore.prepareProfileData();

      // Override isAvailable with new value
      profileData.isAvailable = newIsAvailable;

      // Silent update
      console.log('Auto-saving doctor availability status change...');
      const success = await doctorProfileApi.updateDataSilent(profileData);

      if (success) {
        console.log('Doctor availability status updated successfully');
        // Update saved values
        doctorProfileStore.setSavedValues({
          ...doctorProfileStore.savedValues,
          isAvailable: newIsAvailable
        });
      }
    } catch (error) {
      console.error('Error auto-saving doctor availability status:', error);
      // Don't show alert to avoid disrupting user experience
    }
  };

  // Handle doctor availableDays toggle with immediate save
  const handleDoctorAvailableDayToggle = async (day: string) => {
    try {
      // Toggle the day in the store
      doctorProfileStore.toggleAvailableDay(day);
      
      // Get the updated days array after toggling
      const updatedDays = [...doctorProfileStore.availableDays];
      
      // Prepare profile data
      const profileData = doctorProfileStore.prepareProfileData();

      // Override availableDays with updated array
      profileData.availableDays = updatedDays;

      // Silent update
      console.log('Auto-saving doctor available days change...');
      const success = await doctorProfileApi.updateDataSilent(profileData);

      if (success) {
        console.log('Doctor available days updated successfully');
        // Update saved values
        doctorProfileStore.setSavedValues({
          ...doctorProfileStore.savedValues,
          availableDays: updatedDays
        });
      }
    } catch (error) {
      console.error('Error auto-saving doctor available days:', error);
      // Don't show alert to avoid disrupting user experience
    }
  };

  // Handle doctor availableSlots add with immediate save
  const handleDoctorAvailableSlotAdd = async (slot: string) => {
    try {
      // Add the slot to the store
      doctorProfileStore.addAvailableSlot(slot);
      
      // Get the updated slots array after adding
      const updatedSlots = [...doctorProfileStore.availableSlots];
      
      // Prepare profile data
      const profileData = doctorProfileStore.prepareProfileData();

      // Override availableSlots with updated array
      profileData.availableSlots = updatedSlots;

      // Silent update
      console.log('Auto-saving doctor available slots change...');
      const success = await doctorProfileApi.updateDataSilent(profileData);

      if (success) {
        console.log('Doctor available slots updated successfully');
        // Update saved values
        doctorProfileStore.setSavedValues({
          ...doctorProfileStore.savedValues,
          availableSlots: updatedSlots
        });
      }
    } catch (error) {
      console.error('Error auto-saving doctor available slots:', error);
      // Don't show alert to avoid disrupting user experience
    }
  };

  // Handle doctor availableSlots remove with immediate save
  const handleDoctorAvailableSlotRemove = async (slot: string) => {
    try {
      // Remove the slot from the store
      doctorProfileStore.removeAvailableSlot(slot);
      
      // Get the updated slots array after removing
      const updatedSlots = doctorProfileStore.availableSlots.filter(s => s !== slot);
      
      // Prepare profile data
      const profileData = doctorProfileStore.prepareProfileData();

      // Override availableSlots with updated array
      profileData.availableSlots = updatedSlots;

      // Silent update
      console.log('Auto-saving doctor available slots change...');
      const success = await doctorProfileApi.updateDataSilent(profileData);

      if (success) {
        console.log('Doctor available slots updated successfully');
        // Update saved values
        doctorProfileStore.setSavedValues({
          ...doctorProfileStore.savedValues,
          availableSlots: updatedSlots
        });
      }
    } catch (error) {
      console.error('Error auto-saving doctor available slots:', error);
      // Don't show alert to avoid disrupting user experience
    }
  };

  // Check if there are unsaved changes in the doctor profile
  const hasDoctorProfileChanges = () => {
    const state = doctorProfileStore;
    const { savedValues } = doctorProfileStore;

    // For arrays like specializations and qualifications
    const isSpecializationsChanged = JSON.stringify(state.specializations) !== JSON.stringify(savedValues.specializations);
    const isQualificationsChanged = JSON.stringify(state.qualifications) !== JSON.stringify(savedValues.qualifications);
    const isAvailableDaysChanged = JSON.stringify(state.availableDays) !== JSON.stringify(savedValues.availableDays);
    const isAvailableSlotsChanged = JSON.stringify(state.availableSlots) !== JSON.stringify(savedValues.availableSlots);

    // For other primitive fields
    return state.description !== savedValues.description ||
      state.experience !== savedValues.experience ||
      isSpecializationsChanged ||
      isQualificationsChanged ||
      state.consultationFee !== savedValues.consultationFee ||
      state.age !== savedValues.age ||
      state.gender !== savedValues.gender ||
      state.isAvailable !== savedValues.isAvailable ||
      state.consultationType !== savedValues.consultationType ||
      state.coverImage !== savedValues.coverImage ||
      state.clinicName !== savedValues.clinicName ||
      state.clinicPhone !== savedValues.clinicPhone ||
      state.clinicEmail !== savedValues.clinicEmail ||
      state.clinicWebsite !== savedValues.clinicWebsite ||
      state.clinicAddress !== savedValues.clinicAddress ||
      state.clinicPinCode !== savedValues.clinicPinCode ||
      state.clinicCity !== savedValues.clinicCity ||
      isAvailableDaysChanged ||
      isAvailableSlotsChanged;
  };

  // Save doctor profile
  const handleUpdateDoctorProfile = async () => {
    try {
      uiStore.setUpdating(true);

      // Get prepared profile data from store
      const profileData = doctorProfileStore.prepareProfileData();

      console.log('Submitting doctor profile data:', JSON.stringify(profileData, null, 2));
      const response = await doctorProfileApi.updateData(profileData);

      if (response) {
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
          isAvailable: doctorProfileStore.isAvailable,
          availableDays: doctorProfileStore.availableDays,
          availableSlots: doctorProfileStore.availableSlots,
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

  // Filter cities based on input
  const filterCities = (searchText: string) => {
    const regexp = new RegExp(searchText, 'i');
    const filtered = uiStore.cities.filter(city => regexp.test(city));
    setFilteredCities(filtered);
  };

  // Track changes to form fields
  useEffect(() => {
    // Check if any field has changed from the saved values
    const hasChanges =
      userProfileStore.age !== userProfileStore.savedValues.age ||
      userProfileStore.gender !== userProfileStore.savedValues.gender ||
      userProfileStore.medicalHistory !== userProfileStore.savedValues.medicalHistory ||
      userProfileStore.address !== userProfileStore.savedValues.address ||
      userProfileStore.pinCode !== userProfileStore.savedValues.pinCode ||
      userProfileStore.city !== userProfileStore.savedValues.city ||
      userProfileStore.medicalHistoryPdf !== userProfileStore.savedValues.medicalHistoryPdf;

    // Using hasUnsavedChanges state as ProfileUIState doesn't have setHasUnsavedChanges method
    const hasUnsavedChanges = hasChanges;
  }, [userProfileStore.age, userProfileStore.gender, userProfileStore.medicalHistory, userProfileStore.address, userProfileStore.pinCode, userProfileStore.city, userProfileStore.medicalHistoryPdf, userProfileStore.savedValues]);

  // Check if there are unsaved changes in the user profile
  const hasUserProfileChanges = () => {
    const { age, gender, medicalHistory, address, pinCode, city, medicalHistoryPdf } = userProfileStore;
    const { savedValues } = userProfileStore;

    return age !== savedValues.age ||
      gender !== savedValues.gender ||
      medicalHistory !== savedValues.medicalHistory ||
      address !== savedValues.address ||
      pinCode !== savedValues.pinCode ||
      city !== savedValues.city ||
      medicalHistoryPdf !== savedValues.medicalHistoryPdf;
  };

  // Regular handlers for other fields (will show highlights and require save button)
  const handleAgeChange = (text: string) => {
    userProfileStore.setAge(text);
  };

  const handleAddressChange = (text: string) => {
    userProfileStore.setAddress(text);
  };

  const handlePinCodeChange = (text: string) => {
    // Allow only digits and limit to 6 characters
    const formattedText = text.replace(/\D/g, '').substring(0, 6);
    userProfileStore.setPinCode(formattedText);
  };

  const handleMedicalHistoryChange = (text: string) => {
    userProfileStore.setMedicalHistory(text);
  };

  // Handle gender change with immediate save
  const handleGenderChange = async (newGender: string) => {
    try {
      // Set gender in store
      userProfileStore.setGender(newGender);

      // Prepare profile data with only the changed field and required data
      const profileData = {
        profilePicture: userProfileStore.profilePicture,
        age: userProfileStore.age ? parseInt(userProfileStore.age) : undefined,
        gender: newGender.toLowerCase(),
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

      // Silent update
      console.log('Auto-saving gender change...');
      const success = await userProfileApi.updateDataSilent(profileData);

      if (success) {
        console.log('Gender updated successfully');
        // Update saved values
        userProfileStore.setSavedValues({
          ...userProfileStore.savedValues,
          gender: newGender
        });
      }
    } catch (error) {
      console.error('Error auto-saving gender:', error);
      // Don't show alert to avoid disrupting user experience
    }
  };

  // Handle city change with immediate save
  const handleCityChange = async (newCity: string) => {
    try {
      // Set city in store
      userProfileStore.setCity(newCity);

      // Prepare profile data with only the changed field and required data
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
        city: newCity
      };

      // Silent update
      console.log('Auto-saving city change...');
      const success = await userProfileApi.updateDataSilent(profileData);

      if (success) {
        console.log('City updated successfully');
        // Update saved values
        userProfileStore.setSavedValues({
          ...userProfileStore.savedValues,
          city: newCity
        });
      }
    } catch (error) {
      console.error('Error auto-saving city:', error);
      // Don't show alert to avoid disrupting user experience
    }
  };

  // Handle doctor gender change with immediate save
  const handleDoctorGenderChange = async (newGender: string) => {
    try {
      // Set gender in store
      doctorProfileStore.setGender(newGender);

      // Prepare profile data
      const profileData = doctorProfileStore.prepareProfileData();

      // Override gender with new value
      profileData.gender = newGender.toLowerCase();

      // Silent update
      console.log('Auto-saving doctor gender change...');
      const success = await doctorProfileApi.updateDataSilent(profileData);

      if (success) {
        console.log('Doctor gender updated successfully');
        // Update saved values
        doctorProfileStore.setSavedValues({
          ...doctorProfileStore.savedValues,
          gender: newGender
        });
      }
    } catch (error) {
      console.error('Error auto-saving doctor gender:', error);
      // Don't show alert to avoid disrupting user experience
    }
  };

  // Handle doctor city change with immediate save
  const handleDoctorCityChange = async (newCity: string) => {
    try {
      // Set city in store
      doctorProfileStore.setClinicCity(newCity);

      // Prepare profile data
      const profileData = doctorProfileStore.prepareProfileData();

      // Override city with new value
      profileData.city = newCity;

      // Silent update
      console.log('Auto-saving doctor city change...');
      const success = await doctorProfileApi.updateDataSilent(profileData);

      if (success) {
        console.log('Doctor city updated successfully');
        // Update saved values
        doctorProfileStore.setSavedValues({
          ...doctorProfileStore.savedValues,
          clinicCity: newCity
        });
      }
    } catch (error) {
      console.error('Error auto-saving doctor city:', error);
      // Don't show alert to avoid disrupting user experience
    }
  };

  // Handle consultation type change with immediate save
  const handleDoctorConsultationTypeChange = async (newType: string) => {
    try {
      console.log(`Changing consultation type to: ${newType}`);
      
      // Set consultation type in store
      doctorProfileStore.setConsultationType(newType);

      // Prepare profile data
      const profileData = doctorProfileStore.prepareProfileData();

      // Override consultation type with new value
      profileData.consultationType = newType;

      // Silent update
      console.log('Auto-saving doctor consultation type change...');
      const success = await doctorProfileApi.updateDataSilent(profileData);

      if (success) {
        console.log('Doctor consultation type updated successfully');
        // Update saved values
        doctorProfileStore.setSavedValues({
          ...doctorProfileStore.savedValues,
          consultationType: newType
        });
      }
    } catch (error) {
      console.error('Error auto-saving doctor consultation type:', error);
      // Don't show alert to avoid disrupting user experience
    }
  };

  // Render the correct profile form based on user role
  const renderProfileForm = () => {
    if (!user) return null;

    switch (user.role) {
      case UserRole.USER:
        return (
          <UserProfileForm
            age={userProfileStore.age}
            gender={userProfileStore.gender}
            address={userProfileStore.address}
            pinCode={userProfileStore.pinCode}
            city={userProfileStore.city}
            medicalHistory={userProfileStore.medicalHistory}
            medicalHistoryPdf={userProfileStore.medicalHistoryPdf}
            uploadingPdf={uiStore.uploadingPdf}
            cities={uiStore.cities}
            onChangeAge={handleAgeChange}
            onChangeGender={handleGenderChange}
            onChangeAddress={handleAddressChange}
            onChangePinCode={handlePinCodeChange}
            onChangeCity={handleCityChange}
            onChangeMedicalHistory={handleMedicalHistoryChange}
            onDocumentPick={handleDocumentPick}
            savedValues={userProfileStore.savedValues}
          />
        );
      case UserRole.DOCTOR:
        console.log("Rendering doctor form with consultationType:", doctorProfileStore.consultationType);
        return (
          <DoctorProfileForm
            description={doctorProfileStore.description}
            experience={doctorProfileStore.experience}
            specializations={doctorProfileStore.specializations}
            availableSpecializations={doctorProfileStore.availableSpecializations}
            qualifications={doctorProfileStore.qualifications}
            availableQualifications={doctorProfileStore.availableQualifications}
            consultationFee={doctorProfileStore.consultationFee}
            age={doctorProfileStore.age}
            gender={doctorProfileStore.gender}
            consultationType={doctorProfileStore.consultationType}
            coverImage={doctorProfileStore.coverImage}
            clinicName={doctorProfileStore.clinicName}
            clinicPhone={doctorProfileStore.clinicPhone}
            clinicEmail={doctorProfileStore.clinicEmail}
            clinicWebsite={doctorProfileStore.clinicWebsite}
            clinicAddress={doctorProfileStore.clinicAddress}
            clinicPinCode={doctorProfileStore.clinicPinCode}
            clinicCity={doctorProfileStore.clinicCity}
            isAvailable={doctorProfileStore.isAvailable}
            availableDays={doctorProfileStore.availableDays}
            availableSlots={doctorProfileStore.availableSlots}
            cities={uiStore.cities}
            uploadingCoverImage={uiStore.uploadingCoverImage}
            onChangeDescription={(text) => doctorProfileStore.setDescription(text)}
            onChangeExperience={(text) => doctorProfileStore.setExperience(text)}
            onAddSpecialization={(spec) => doctorProfileStore.addSpecialization(spec)}
            onRemoveSpecialization={(index) => doctorProfileStore.removeSpecialization(index)}
            onAddQualification={(qual) => doctorProfileStore.addQualification(qual)}
            onRemoveQualification={(index) => doctorProfileStore.removeQualification(index)}
            onChangeConsultationFee={(fee) => doctorProfileStore.setConsultationFee(fee)}
            onChangeAge={(age) => doctorProfileStore.setAge(age)}
            onChangeGender={handleDoctorGenderChange}
            onChangeConsultationType={handleDoctorConsultationTypeChange}
            onChangeCoverImage={handleCoverImagePick}
            onChangeClinicName={(name) => doctorProfileStore.setClinicName(name)}
            onChangeClinicPhone={(phone) => doctorProfileStore.setClinicPhone(phone)}
            onChangeClinicEmail={(email) => doctorProfileStore.setClinicEmail(email)}
            onChangeClinicWebsite={(website) => doctorProfileStore.setClinicWebsite(website)}
            onChangeClinicAddress={(address) => doctorProfileStore.setClinicAddress(address)}
            onChangeClinicPinCode={(pinCode) => doctorProfileStore.setClinicPinCode(pinCode)}
            onChangeClinicCity={handleDoctorCityChange}
            onChangeIsAvailable={handleDoctorIsAvailableChange}
            onToggleAvailableDay={handleDoctorAvailableDayToggle}
            onAddAvailableSlot={handleDoctorAvailableSlotAdd}
            onRemoveAvailableSlot={handleDoctorAvailableSlotRemove}
            savedValues={doctorProfileStore.savedValues}
          />
        );
      case UserRole.LABORATORY:
        return <LaboratoryProfileForm />;
      case UserRole.DELIVERY_BOY:
        return <DeliveryProfileForm />;
      default:
        return (
          <View className="bg-yellow-50 p-4 rounded-xl mb-6">
            <Text className="text-yellow-700 text-center">
              Profile settings for your role are not yet available.
            </Text>
          </View>
        );
    }
  };

  // Show loading indicator only during initial load
  if (uiStore.loading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="mt-4 text-gray-500">Loading profile data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <StatusBar style="auto" />

        {/* Main container - keyboard avoiding removed */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View style={{ flex: 1 }}>
              <ScrollView
                className="flex-1 px-5"
              >
                {/* Header Section */}
                <ProfileHeader
                  userData={user}
                  onLogout={handleLogout}
                />

                {/* Dynamic Form Section based on role */}
                {renderProfileForm()}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>

      {/* Floating Save Button (only show when there are changes) */}
      {(user?.role === UserRole.USER && hasUserProfileChanges()) && (
        <SaveButton onPress={handleUpdateUserProfile} loading={uiStore.updating} />
      )}

      {/* Floating Save Button for Doctor Profile */}
      {(user?.role === UserRole.DOCTOR && hasDoctorProfileChanges()) && (
        <SaveButton onPress={handleUpdateDoctorProfile} loading={uiStore.updating} />
      )}

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={uiStore.showImageOptions}
        onClose={() => uiStore.setShowImageOptions(false)}
        onTakePhoto={openCamera}
        onChooseFromGallery={openGallery}
      />
    </View>
  );
};

export default Profile;
