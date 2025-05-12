import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';

import { store } from '@/utils';
import { UserRole } from '@/types/userTypes';
import { UserData, UserProfile, ProfileUpdateData, Address } from '@/types/profileTypes';
import useProfileApi from '@/hooks/useProfileApi';
import { useUserStore } from '@/store/userStore';
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
  
  // User data states
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  // Form state
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [medicalHistoryPdf, setMedicalHistoryPdf] = useState('');

  // Custom hooks for API calls
  const userApi = useProfileApi({
    endpoint: '/api/v1/me',
    onSuccess: (data) => {
      setUserData(data);
      // Save to store for persistent data
      setUser(data);
    },
    onError: () => {
      // If API fails, use data from store if available
      if (user) {
        setUserData(user);
      }
    }
  });

  const profileApi = useProfileApi({
    endpoint: '/api/v1/user-profile',
    onSuccess: (data: UserProfile) => {
      // Set form values from API response
      console.log('Profile data received:', data);
      updateFormValues(data);
    },
    onError: (error) => {
      console.error('Profile API error:', error);
      // If API fails, just leave empty fields for user to fill
      setLoading(false);
    }
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const updateFormValues = (data: UserProfile) => {
    console.log('Setting form values from profile data:', data);
    // Update form state from profile data
    setAge(data.age?.toString() || '');
    
    // Handle gender with title case
    if (data.gender) {
      const formattedGender = data.gender.charAt(0).toUpperCase() + data.gender.slice(1);
      setGender(formattedGender);
      console.log('Setting gender to:', formattedGender);
    }
    
    setMedicalHistory(data.medicalHistory || '');
    
    // Handle address object structure
    if (data.address) {
      setAddress(data.address.address || '');
      setPinCode(data.address.pinCode || '');
      console.log('Setting address to:', data.address.address);
      console.log('Setting pinCode to:', data.address.pinCode);
    } else {
      setAddress('');
      setPinCode('');
    }
    
    setProfilePicture(data.profilePicture || '');
    setMedicalHistoryPdf(data.medicalHistoryPdf || '');
    
    console.log('Form values set successfully');
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Try to get user data from API
      await userApi.fetchData();
      
      // Try to get profile data separately
      try {
        console.log('Attempting to fetch profile data...');
        const profileResponse = await apiClient.get('/api/v1/profile');
        console.log('Profile data received:', profileResponse.data);
        
        // Update form with profile data
        updateFormValues(profileResponse.data);
        
        // Store in profileApi's data
        profileApi.setData(profileResponse.data);
      } catch (error: any) {
        console.log('Profile GET error:', error.response?.status, error.response?.data);
        
        // If 404, try to create a new profile with a POST request
        if (error.response?.status === 404) {
          console.log('No profile found, will create one when user saves');
        }
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      // If user data fetch fails, use store data
      if (user) {
        setUserData(user);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await store.delete('token');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("Camera permission is required to take photos");
      return;
    }
    
    setShowImageOptions(false);
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    setShowImageOptions(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      
      const s3Url = await profileApi.uploadFile(
        'image/jpeg',
        `profile-${Date.now()}.jpg`,
        imageUri
      );
      
      if (s3Url) {
        setProfilePicture(s3Url);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImagePick = () => {
    setShowImageOptions(true);
  };

  const handleDocumentPick = async () => {
    try {
      setUploadingPdf(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false) {
        const s3Url = await profileApi.uploadFile(
          'application/pdf',
          `medical-history-${Date.now()}.pdf`,
          result.assets[0].uri
        );
        
        if (s3Url) {
          setMedicalHistoryPdf(s3Url);
          
          // Immediately update the profile when PDF is uploaded
          const genderValue = gender ? gender.toLowerCase() : undefined;
          
          // Format address as per backend model
          const addressData: Address = {
            address: address,
            pinCode: pinCode,
            latitude: null,
            longitude: null
          };
          
          const profileData: ProfileUpdateData = {
            profilePicture,
            age: age ? parseInt(age) : undefined,
            gender: genderValue,
            medicalHistory,
            medicalHistoryPdf: s3Url, // Use the newly uploaded PDF URL
            address: addressData,
          };
          
          // Add ID if available from API data
          if (profileApi.data?._id) {
            profileData._id = profileApi.data._id;
          }
          
          console.log('Automatically updating profile with new PDF:', profileData);
          const success = await profileApi.updateData(profileData);
          
          if (success) {
            console.log('Profile automatically updated with new PDF');
            alert('Medical history PDF uploaded and profile updated');
            
            // Refresh profile data
            try {
              const profileResponse = await apiClient.get('/api/v1/profile');
              updateFormValues(profileResponse.data);
              profileApi.setData(profileResponse.data);
            } catch (error) {
              console.error('Error refreshing profile data:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      alert('Failed to upload document');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      
      // Convert gender to lowercase as per backend model
      const genderValue = gender ? gender.toLowerCase() : undefined;
      
      // Format address as per backend model
      const addressData: Address = {
        address: address,
        pinCode: pinCode,
        latitude: null,
        longitude: null
      };
      
      const profileData: ProfileUpdateData = {
        profilePicture,
        age: age ? parseInt(age) : undefined,
        gender: genderValue,
        medicalHistory,
        medicalHistoryPdf,
        address: addressData,
      };
      
      // Add ID if available from API data
      if (profileApi.data?._id) {
        profileData._id = profileApi.data._id;
      }
      
      console.log('Submitting profile data:', profileData);
      const success = await profileApi.updateData(profileData);
      
      if (success) {
        alert('Profile updated successfully');
        
        // Refetch data to ensure we have the latest values
        try {
          console.log('Refreshing profile data after update');
          const profileResponse = await apiClient.get('/api/v1/profile');
          console.log('Updated profile data:', profileResponse.data);
          
          // Update form with latest profile data
          updateFormValues(profileResponse.data);
          
          // Store in profileApi's data
          profileApi.setData(profileResponse.data);
        } catch (error) {
          console.error('Error refreshing profile data:', error);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  // Get display role
  const displayRole = userData?.role || UserRole.USER;

  // Show loading indicator only during initial load
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="mt-4 text-gray-500">Loading profile data...</Text>
      </SafeAreaView>
    );
  }

  // Render profile form based on role
  const renderProfileForm = () => {
    console.log('Rendering profile form with values:', {
      age,
      gender,
      address,
      pinCode,
      medicalHistory,
      medicalHistoryPdf
    });
    
    switch (displayRole) {
      case UserRole.USER:
        return (
          <UserProfileForm 
            age={age}
            gender={gender}
            address={address}
            pinCode={pinCode}
            medicalHistory={medicalHistory}
            medicalHistoryPdf={medicalHistoryPdf}
            uploadingPdf={uploadingPdf}
            onChangeAge={setAge}
            onChangeGender={setGender}
            onChangeAddress={setAddress}
            onChangePinCode={setPinCode}
            onChangeMedicalHistory={setMedicalHistory}
            onDocumentPick={handleDocumentPick}
          />
        );
      case UserRole.DOCTOR:
        return <DoctorProfileForm />;
      case UserRole.LABORATORY:
        return <LaboratoryProfileForm />;
      case UserRole.DELIVERY_BOY:
        return <DeliveryProfileForm />;
      default:
        return (
          <Text className="text-center text-gray-500 p-4">
            Profile form not available for this role
          </Text>
        );
    }
  };
  
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <StatusBar style="auto" />
        
        {/* Main container */}
        <ScrollView 
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 100 }} // Add extra padding at bottom
        >
          {/* Header Section */}
          <ProfileHeader 
            userData={userData}
            // profilePicture={profilePicture}
            // uploadingImage={uploadingImage}
            // onImagePick={handleImagePick}
            onLogout={handleLogout}
          />
          
          {/* Dynamic Form Section based on role */}
          {renderProfileForm()}
        </ScrollView>
      </SafeAreaView>

      {/* Floating Save Button (only for editable roles) */}
      {displayRole === UserRole.USER && (
        <SaveButton onPress={handleUpdateProfile} loading={updating} />
      )}

      {/* Image Picker Modal */}
      <ImagePickerModal 
        visible={showImageOptions}
        onClose={() => setShowImageOptions(false)}
        onTakePhoto={openCamera}
        onChooseFromGallery={openGallery}
      />

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              // Calculate age
              const today = new Date();
              let calculatedAge = today.getFullYear() - selectedDate.getFullYear();
              const m = today.getMonth() - selectedDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
                calculatedAge--;
              }
              setAge(calculatedAge.toString());
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

export default Profile;
