import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Text, ScrollView, View, Platform, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';

import { store } from '@/utils';
import { UserRole } from '@/types/userTypes';
import { UserData, UserProfile, ProfileUpdateData, Address, DoctorProfile } from '@/types/profileTypes';
import { useUserStore } from '@/store/userStore';
import { useUserProfileStore, useDoctorProfileStore, useLaboratoryProfileStore, useProfileUIStore } from '@/store/profileStore';
import useProfileApi from '@/hooks/useProfileApi';
import apiClient from '@/api/client';

// Import modular components
import ProfileHeader from '@/components/profile/ProfileHeader';
import UserProfileForm from '@/components/profile/UserProfileForm';
import DoctorProfileForm from '@/components/profile/DoctorProfileForm';
import LaboratoryProfileForm from '@/components/profile/LaboratoryProfileForm';
import SaveButton from '@/components/profile/SaveButton';
import ImagePickerModal from '@/components/profile/ImagePickerModal';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Profile = () => {
  const router = useRouter();
  const { user, setUser } = useUserStore();

  // Use Zustand stores directly
  const userProfileStore = useUserProfileStore();
  const doctorProfileStore = useDoctorProfileStore();
  const laboratoryProfileStore = useLaboratoryProfileStore();
  const uiStore = useProfileUIStore();

  // Local state for UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // For tracking file picks
  const [cameraCaptureUri, setCameraCaptureUri] = useState<string | null>(null);
  const [galleryCaptureUri, setGalleryCaptureUri] = useState<string | null>(null);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

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

  const laboratoryProfileApi = useProfileApi({
    endpoint: '/api/v1/laboratory-profile'
  });

  // Setup keyboard listener
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Initialize basic info from user data
    if (user) {
      setBasicInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

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
          if (user?.role === UserRole.USER || user?.role === UserRole.DELIVERY_BOY) {
            userProfileStore.updateFromApiResponse(profileData.profile);
          } else if (user?.role === UserRole.DOCTOR) {
            doctorProfileStore.updateFromApiResponse(profileData.profile);
            
            // Log doctor profile state after update
            console.log('Doctor profile state after API update:', {
              specializations: doctorProfileStore.specializations,
              qualifications: doctorProfileStore.qualifications,
              isAvailable: doctorProfileStore.isAvailable
            });
          } else if (user?.role === UserRole.LABORATORY) {
            laboratoryProfileStore.updateFromApiResponse(profileData.profile);
          }

          // Set available cities - store will handle preventing overwrite
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

          // Set available lab service categories for laboratory profiles
          if (user?.role === UserRole.LABORATORY) {
            if (profileData.availableLabServiceCategories && 
                Array.isArray(profileData.availableLabServiceCategories)) {
              uiStore.setLabServiceCategories(profileData.availableLabServiceCategories);
              console.log(`Loaded ${profileData.availableLabServiceCategories.length} available lab service categories`);
            } else {
              console.warn('No laboratory service categories found in API response');
              // Set some defaults if none are provided
              const defaultCategories = ["Blood Test", "Urine Test", "Imaging", "Pathology", "Microbiology"];
              uiStore.setLabServiceCategories(defaultCategories);
              console.log('Using default laboratory service categories:', defaultCategories);
            }
          }

          // Set available specializations and qualifications for doctor profiles
          if (user?.role === UserRole.DOCTOR) {
            // Set available specializations - store will handle preventing overwrite
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
              // Set some defaults if none are provided and they haven't been set yet
              const defaultSpecializations = ["Cardiologist", "Dermatologist", "Pediatrician", "Neurologist", "Orthopedic Surgeon"];
              doctorProfileStore.setAvailableSpecializations(defaultSpecializations);
              console.log('Using default specializations:', defaultSpecializations);
            }

            // Set available qualifications - store will handle preventing overwrite
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
              // Set some defaults if none are provided and they haven't been set yet
              const defaultQualifications = ["MBBS", "MD", "MS", "DM"];
              doctorProfileStore.setAvailableQualifications(defaultQualifications);
              console.log('Using default qualifications:', defaultQualifications);
            }
          }
        } else {
          // Fallback to legacy format
          if (user?.role === UserRole.USER || user?.role === UserRole.DELIVERY_BOY) {
            userProfileStore.updateFromApiResponse(profileData);
          } else if (user?.role === UserRole.DOCTOR) {
            doctorProfileStore.updateFromApiResponse(profileData);
          } else if (user?.role === UserRole.LABORATORY) {
            laboratoryProfileStore.updateFromApiResponse(profileData);
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

  // Handle basic info update
  const handleUpdateBasicInfo = async () => {
    try {
      uiStore.setUpdating(true);
      
      // Update user basic info
      const response = await apiClient.post('/api/v1/update-user-basic-info', {
        name: basicInfo.name,
        email: basicInfo.email,
        phone: basicInfo.phone,
        profilePicture: user?.profilePicture
      });

      if (response.data) {
        // Update local user state
        setUser(response.data);
        setIsEditingBasicInfo(false);
        alert('Basic info updated successfully');
      }
    } catch (error) {
      console.error('Error updating basic info:', error);
      alert('Failed to update basic info');
    } finally {
      uiStore.setUpdating(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePicturePress = () => {
    uiStore.setShowImageOptions(true);
  };

  // Image picker handler - only gallery
  const openGallery = async () => {
    try {
      uiStore.setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    } finally {
      uiStore.setUploadingImage(false);
      uiStore.setShowImageOptions(false);
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      console.log('Uploading profile picture from:', imageUri);

      // Get file details
      const fileName = `profile-picture-${Date.now()}.jpg`;
      const fileType = 'image/jpeg';

      // Get presigned URL and upload image
      const imageUrl = await userProfileApi.uploadFile(fileType, fileName, imageUri, false);

      if (imageUrl) {
        console.log('Profile picture uploaded successfully, URL:', imageUrl);

        // Update user basic info with new profile picture
        const response = await apiClient.post('/api/v1/update-user-basic-info', {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          profilePicture: imageUrl
        });

        if (response.data) {
          // Update local user state
          setUser(response.data);
        }
      } else {
        throw new Error('Failed to get URL for the uploaded image');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    } finally {
      uiStore.setUploadingImage(false);
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

          // Add new PDF to the array in store
          const updatedPdfs = [...(userProfileStore.medicalHistoryPdfs || []), pdfUrl];
          userProfileStore.setMedicalHistoryPdfs(updatedPdfs);

          // Auto-save the PDF change
          const profileData = {
            profilePicture: userProfileStore.profilePicture,
            age: userProfileStore.age ? parseInt(userProfileStore.age) : undefined,
            gender: userProfileStore.gender.toLowerCase(),
            medicalHistory: userProfileStore.medicalHistory,
            medicalHistoryPdfs: updatedPdfs,
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
              medicalHistoryPdfs: updatedPdfs
            });

            // Notify user of successful upload
            alert('Medical history PDF uploaded successfully.');
          } else {
            alert('PDF uploaded but failed to save. Please try saving manually.');
          }
        } else {
          throw new Error('Failed to get URL for the uploaded PDF');
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      alert('Failed to upload document');
    } finally {
      uiStore.setUploadingPdf(false);
    }
  };

  // Document delete handler for user profile
  const handleDocumentDelete = async (index: number) => {
    try {
      // Create a new array without the deleted PDF
      const updatedPdfs = userProfileStore.medicalHistoryPdfs.filter((_, i) => i !== index);
      
      // Update the store
      userProfileStore.setMedicalHistoryPdfs(updatedPdfs);

      // Auto-save the change
      const profileData = {
        profilePicture: userProfileStore.profilePicture,
        age: userProfileStore.age ? parseInt(userProfileStore.age) : undefined,
        gender: userProfileStore.gender.toLowerCase(),
        medicalHistory: userProfileStore.medicalHistory,
        medicalHistoryPdfs: updatedPdfs,
        address: {
          address: userProfileStore.address,
          pinCode: userProfileStore.pinCode,
          latitude: null,
          longitude: null
        } as Address,
        city: userProfileStore.city
      };

      console.log('Auto-saving PDF deletion...');
      const success = await userProfileApi.updateDataSilent(profileData);

      if (success) {
        console.log('PDF deletion saved successfully');
        // Update saved values
        userProfileStore.setSavedValues({
          ...userProfileStore.savedValues,
          medicalHistoryPdfs: updatedPdfs
        });
      } else {
        alert('Failed to save PDF deletion. Please try saving manually.');
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
      alert('Failed to delete PDF');
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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Get file details
        const fileName = `cover-image-${Date.now()}.jpg`;
        const fileType = 'image/jpeg';

        // Get presigned URL and upload image
        const imageUrl = await doctorProfileApi.uploadFile(fileType, fileName, result.assets[0].uri, true);

        if (imageUrl) {
          console.log('Cover image uploaded successfully, URL:', imageUrl);
          doctorProfileStore.setCoverImage(imageUrl);
        } else {
          throw new Error('Failed to get URL for the uploaded image');
        }
      }
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Failed to upload cover image');
    } finally {
      uiStore.setUploadingCoverImage(false);
      uiStore.setShowImageOptions(false);
    }
  };

  // Handle service cover image pick for laboratory profile
  const handleServiceCoverImagePick = async (serviceId: string) => {
    try {
      setActiveServiceId(serviceId);
      uiStore.setUploadingCoverImage(true);
      handleImagePick();
    } catch (error) {
      console.error('Error setting up service cover image pick:', error);
      setActiveServiceId(null);
      uiStore.setUploadingCoverImage(false);
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
        medicalHistoryPdfs: userProfileStore.medicalHistoryPdfs,
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
          medicalHistoryPdfs: userProfileStore.medicalHistoryPdfs
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
    const isClinicsChanged = JSON.stringify(state.clinics) !== JSON.stringify(savedValues.clinics);

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
      state.registrationNumber !== savedValues.registrationNumber ||
      isClinicsChanged ||
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
          registrationNumber: doctorProfileStore.registrationNumber,
          clinics: doctorProfileStore.clinics
        });
      }
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      alert('Failed to update doctor profile');
    } finally {
      uiStore.setUpdating(false);
    }
  };

  // Save laboratory profile
  const handleUpdateLaboratoryProfile = async () => {
    try {
      uiStore.setUpdating(true);

      // Get prepared profile data
      const profileData = laboratoryProfileStore.prepareProfileData();

      console.log('Submitting laboratory profile data:', JSON.stringify(profileData, null, 2));
      const response = await laboratoryProfileApi.updateData(profileData);

      if (response) {
        alert('Laboratory profile updated successfully');

        // Update saved values to match current values
        laboratoryProfileStore.setSavedValues({
          laboratoryName: laboratoryProfileStore.laboratoryName,
          laboratoryPhone: laboratoryProfileStore.laboratoryPhone,
          laboratoryEmail: laboratoryProfileStore.laboratoryEmail,
          laboratoryWebsite: laboratoryProfileStore.laboratoryWebsite,
          laboratoryAddress: laboratoryProfileStore.laboratoryAddress,
          laboratoryPinCode: laboratoryProfileStore.laboratoryPinCode,
          laboratoryCity: laboratoryProfileStore.laboratoryCity,
          laboratoryGoogleMapsLink: laboratoryProfileStore.laboratoryGoogleMapsLink,
          laboratoryServices: laboratoryProfileStore.laboratoryServices,
          coverImage: laboratoryProfileStore.coverImage,
          isAvailable: laboratoryProfileStore.isAvailable,
          availableDays: laboratoryProfileStore.availableDays,
          availableSlots: laboratoryProfileStore.availableSlots
        });
      }
    } catch (error) {
      console.error('Error updating laboratory profile:', error);
      alert('Failed to update laboratory profile');
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
      userProfileStore.medicalHistoryPdfs !== userProfileStore.savedValues.medicalHistoryPdfs;

    // Using hasUnsavedChanges state as ProfileUIState doesn't have setHasUnsavedChanges method
    const hasUnsavedChanges = hasChanges;
  }, [userProfileStore.age, userProfileStore.gender, userProfileStore.medicalHistory, userProfileStore.address, userProfileStore.pinCode, userProfileStore.city, userProfileStore.medicalHistoryPdfs, userProfileStore.savedValues]);

  // Check if there are unsaved changes in the user profile
  const hasUserProfileChanges = () => {
    const { age, gender, medicalHistory, address, pinCode, city, medicalHistoryPdfs } = userProfileStore;
    const { savedValues } = userProfileStore;

    return age !== savedValues.age ||
      gender !== savedValues.gender ||
      medicalHistory !== savedValues.medicalHistory ||
      address !== savedValues.address ||
      pinCode !== savedValues.pinCode ||
      city !== savedValues.city ||
      medicalHistoryPdfs !== savedValues.medicalHistoryPdfs;
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
        medicalHistoryPdfs: userProfileStore.medicalHistoryPdfs,
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
        medicalHistoryPdfs: userProfileStore.medicalHistoryPdfs,
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

  // Determine if any changes have been made to show save button
  const hasChanges = () => {
    if (user?.role === UserRole.USER) {
      // Check user profile changes
      return hasUserProfileChanges();
    } else if (user?.role === UserRole.DOCTOR) {
      // Check doctor profile changes
      return hasDoctorProfileChanges();
    } else if (user?.role === UserRole.LABORATORY) {
      // Check laboratory profile changes
      return (
        laboratoryProfileStore.laboratoryName !== laboratoryProfileStore.savedValues.laboratoryName ||
        laboratoryProfileStore.laboratoryPhone !== laboratoryProfileStore.savedValues.laboratoryPhone ||
        laboratoryProfileStore.laboratoryEmail !== laboratoryProfileStore.savedValues.laboratoryEmail ||
        laboratoryProfileStore.laboratoryWebsite !== laboratoryProfileStore.savedValues.laboratoryWebsite ||
        laboratoryProfileStore.laboratoryAddress !== laboratoryProfileStore.savedValues.laboratoryAddress ||
        laboratoryProfileStore.laboratoryPinCode !== laboratoryProfileStore.savedValues.laboratoryPinCode ||
        laboratoryProfileStore.laboratoryCity !== laboratoryProfileStore.savedValues.laboratoryCity ||
        laboratoryProfileStore.laboratoryGoogleMapsLink !== laboratoryProfileStore.savedValues.laboratoryGoogleMapsLink ||
        JSON.stringify(laboratoryProfileStore.laboratoryServices) !== JSON.stringify(laboratoryProfileStore.savedValues.laboratoryServices)
      );
    }
    return false;
  };

  // Save profile changes
  const handleSaveChanges = async () => {
    if (user?.role === UserRole.USER || user?.role === UserRole.DELIVERY_BOY) {
      await handleUpdateUserProfile();
    } else if (user?.role === UserRole.DOCTOR) {
      await handleUpdateDoctorProfile();
    } else if (user?.role === UserRole.LABORATORY) {
      await handleUpdateLaboratoryProfile();
    }
  };

  // Render the correct profile form based on user role
  const renderProfileForm = () => {
    if (!user) return null;

    switch (user.role) {
      case UserRole.USER:
      case UserRole.DELIVERY_BOY:
        return (
          <UserProfileForm
            age={userProfileStore.age}
            gender={userProfileStore.gender}
            address={userProfileStore.address}
            pinCode={userProfileStore.pinCode}
            city={userProfileStore.city}
            medicalHistory={userProfileStore.medicalHistory}
            medicalHistoryPdfs={userProfileStore.medicalHistoryPdfs}
            uploadingPdf={uiStore.uploadingPdf}
            cities={uiStore.cities}
            userRole={user.role}
            onChangeAge={handleAgeChange}
            onChangeGender={handleGenderChange}
            onChangeAddress={handleAddressChange}
            onChangePinCode={handlePinCodeChange}
            onChangeCity={handleCityChange}
            onChangeMedicalHistory={handleMedicalHistoryChange}
            onDocumentPick={handleDocumentPick}
            onDocumentDelete={handleDocumentDelete}
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
            registrationNumber={doctorProfileStore.registrationNumber}
            clinics={doctorProfileStore.clinics}
            cities={uiStore.cities}
            isAvailable={doctorProfileStore.isAvailable}
            availableDays={doctorProfileStore.availableDays}
            availableSlots={doctorProfileStore.availableSlots}
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
            onChangeRegistrationNumber={(text) => doctorProfileStore.setRegistrationNumber(text)}
            onAddClinic={() => doctorProfileStore.addClinic()}
            onRemoveClinic={(index) => doctorProfileStore.removeClinic(index)}
            onChangeClinicName={(text, index) => doctorProfileStore.updateClinic(index, 'clinicName', text)}
            onChangeClinicPhone={(text, index) => doctorProfileStore.updateClinic(index, 'clinicPhone', text)}
            onChangeClinicEmail={(text, index) => doctorProfileStore.updateClinic(index, 'clinicEmail', text)}
            onChangeClinicWebsite={(text, index) => doctorProfileStore.updateClinic(index, 'clinicWebsite', text)}
            onChangeClinicAddress={(text, index) => doctorProfileStore.updateClinic(index, 'clinicAddress', text)}
            onChangeClinicPinCode={(text, index) => doctorProfileStore.updateClinic(index, 'clinicPinCode', text)}
            onChangeClinicCity={(city, index) => doctorProfileStore.updateClinic(index, 'clinicCity', city)}
            onChangeClinicGoogleMapsLink={(text, index) => doctorProfileStore.updateClinic(index, 'clinicGoogleMapsLink', text)}
            onChangeIsAvailable={handleDoctorIsAvailableChange}
            onToggleAvailableDay={handleDoctorAvailableDayToggle}
            onAddAvailableSlot={handleDoctorAvailableSlotAdd}
            onRemoveAvailableSlot={handleDoctorAvailableSlotRemove}
            savedValues={doctorProfileStore.savedValues}
          />
        );
      case UserRole.LABORATORY:
        return (
          <LaboratoryProfileForm 
            availableCategories={uiStore.labServiceCategories}
            onServiceCoverImagePick={handleServiceCoverImagePick}
          />
        );
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

        {/* Simplified container structure */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }} // Add padding for the floating save button
        >
          {/* Header Section */}
          <ProfileHeader
            userData={user}
            onLogout={handleLogout}
            onProfilePicturePress={handleProfilePicturePress}
          />
          {isEditingBasicInfo ? (
            <View className="mb-8 bg-white p-4 rounded-xl shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold text-gray-800">Edit Basic Info</Text>
                <TouchableOpacity 
                  onPress={() => setIsEditingBasicInfo(false)}
                  className="p-2"
                >
                  <MaterialCommunityIcons name="close" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Name</Text>
                <TextInput
                  value={basicInfo.name}
                  onChangeText={(text) => setBasicInfo(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your name"
                  className="border border-gray-200 rounded-xl px-4 py-3 bg-white"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Email</Text>
                <TextInput
                  value={basicInfo.email}
                  onChangeText={(text) => setBasicInfo(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  className="border border-gray-200 rounded-xl px-4 py-3 bg-white"
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2">Phone</Text>
                <TextInput
                  value={basicInfo.phone}
                  onChangeText={(text) => setBasicInfo(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  className="border border-gray-200 rounded-xl px-4 py-3 bg-white"
                />
              </View>

              <TouchableOpacity
                onPress={handleUpdateBasicInfo}
                disabled={uiStore.updating}
                className="bg-primary rounded-xl py-3 items-center"
              >
                {uiStore.updating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-medium">Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditingBasicInfo(true)}
              className="mb-8 flex-row items-center justify-center bg-primary/10 rounded-xl py-3"
            >
              <MaterialCommunityIcons name="account-edit" size={24} color="#6366F1" />
              <Text className="text-primary font-medium ml-2">Edit Basic Info</Text>
            </TouchableOpacity>
          )}

          {/* Dynamic Form Section based on role */}
          {renderProfileForm()}

          {/* Delete Account Section */}
          <View className="mt-8 mb-6">
            <View className="bg-red-50 border border-red-200 rounded-xl p-4">
              <Text className="text-red-800 font-semibold text-lg mb-2">Danger Zone</Text>
              <Text className="text-red-700 text-sm mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </Text>
              <TouchableOpacity
                onPress={() => setShowDeleteAccountModal(true)}
                className="bg-red-600 rounded-xl py-3 px-4 flex-row items-center justify-center"
              >
                <MaterialCommunityIcons name="delete" size={20} color="white" />
                <Text className="text-white font-medium ml-2">Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Floating Save Button (only show when there are changes) */}
        {(user?.role === UserRole.USER || user?.role === UserRole.DELIVERY_BOY || user?.role === UserRole.DOCTOR || user?.role === UserRole.LABORATORY) && hasChanges() && (
          <SaveButton onPress={handleSaveChanges} loading={uiStore.updating} />
        )}

        {/* Image Picker Modal */}
        <ImagePickerModal
          visible={uiStore.showImageOptions}
          onClose={() => uiStore.setShowImageOptions(false)}
          onChooseFromGallery={openGallery}
        />

        {/* Delete Account Modal */}
        <DeleteAccountModal
          visible={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
        />
      </SafeAreaView>
    </View>
  );
};

export default Profile;
