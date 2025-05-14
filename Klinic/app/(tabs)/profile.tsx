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

// List of cities for the dropdown
const CITIES = [
  'Bangalore', 
  'Mumbai', 
  'Delhi', 
  'Chennai', 
  'Hyderabad', 
  'Kolkata', 
  'Pune', 
  'Ahmedabad', 
  'Jaipur', 
  'Lucknow'
];

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cities, setCities] = useState<string[]>(CITIES);
  const [filteredCities, setFilteredCities] = useState<string[]>(CITIES);

  // Form state
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [city, setCity] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [medicalHistoryPdf, setMedicalHistoryPdf] = useState('');

  // Saved values to track changes
  const [savedValues, setSavedValues] = useState({
    age: '',
    gender: '',
    medicalHistory: '',
    address: '',
    pinCode: '',
    city: '',
    medicalHistoryPdf: ''
  });

  // Custom hooks for API calls
  const userApi = useProfileApi({
    endpoint: '/api/v1/user',
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

  // Track changes to form fields
  useEffect(() => {
    // Check if any field has changed from the saved values
    const hasChanges = 
      age !== savedValues.age ||
      gender !== savedValues.gender ||
      medicalHistory !== savedValues.medicalHistory ||
      address !== savedValues.address ||
      pinCode !== savedValues.pinCode ||
      city !== savedValues.city ||
      medicalHistoryPdf !== savedValues.medicalHistoryPdf;
    
    setHasUnsavedChanges(hasChanges);
  }, [age, gender, medicalHistory, address, pinCode, city, medicalHistoryPdf, savedValues]);

  const updateFormValues = (data: UserProfile) => {
    console.log('Setting form values from profile data:', data);
    // Update form state from profile data
    const newAge = data.age?.toString() || '';
    setAge(newAge);
    
    // Handle gender with title case
    let newGender = '';
    if (data.gender) {
      newGender = data.gender.charAt(0).toUpperCase() + data.gender.slice(1);
      setGender(newGender);
      console.log('Setting gender to:', newGender);
    }
    
    const newMedicalHistory = data.medicalHistory || '';
    setMedicalHistory(newMedicalHistory);
    
    let newAddress = '';
    let newPinCode = '';
    let newCity = '';
    
    // Handle address object structure
    if (data.address) {
      newAddress = data.address.address || '';
      setAddress(newAddress);
      newPinCode = data.address.pinCode || '';
      setPinCode(newPinCode);
    } else {
      setAddress('');
      setPinCode('');
    }
    
    // Handle city as a top-level property
    if (data.city) {
      newCity = data.city;
      setCity(newCity);
      console.log('Setting city to:', newCity);
    } else {
      setCity('');
    }
    
    setProfilePicture(data.profilePicture || '');
    const newMedicalHistoryPdf = data.medicalHistoryPdf || '';
    setMedicalHistoryPdf(newMedicalHistoryPdf);
    
    // Also update saved values to track changes
    setSavedValues({
      age: newAge,
      gender: newGender,
      medicalHistory: newMedicalHistory,
      address: newAddress,
      pinCode: newPinCode,
      city: newCity,
      medicalHistoryPdf: newMedicalHistoryPdf
    });
    
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
        
        // Handle new response format with profile and availableCities
        if (profileResponse.data && profileResponse.data.profile) {
          // Update form with profile data
          updateFormValues(profileResponse.data.profile);
          
          // Store in profileApi's data
          profileApi.setData(profileResponse.data.profile);
          
          // Set available cities if provided
          if (profileResponse.data.availableCities && Array.isArray(profileResponse.data.availableCities)) {
            setCities(profileResponse.data.availableCities);
          }
        } else {
          // Fallback to legacy format
          updateFormValues(profileResponse.data);
          profileApi.setData(profileResponse.data);
        }
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
          // Update local state and savedValues simultaneously to prevent flickering
          setMedicalHistoryPdf(s3Url);
          setSavedValues(prev => ({
            ...prev,
            medicalHistoryPdf: s3Url
          }));
          
          // Now make the API call
          setUpdating(true);
          const profileData = prepareProfileData();
          // Use the new PDF URL since state might not be updated yet
          profileData.medicalHistoryPdf = s3Url;
          
          console.log('Immediately updating profile with new PDF');
          try {
            const success = await profileApi.updateData(profileData);
            if (success) {
              alert('Medical history PDF uploaded successfully');
            } else {
              alert('Failed to update profile with new PDF');
            }
          } catch (error) {
            console.error('Error updating profile with PDF:', error);
            alert('Error saving PDF to profile');
          } finally {
            setUpdating(false);
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

  // Helper function to prepare profile data for update
  const prepareProfileData = () => {
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
      city: city // Add city as a top-level property
    };
    
    // Add ID if available from API data
    if (profileApi.data?._id) {
      profileData._id = profileApi.data._id;
    }
    
    console.log('Prepared profile data:', profileData);
    return profileData;
  };

  // Handler for updating all other fields via Save button
  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      
      const profileData = prepareProfileData();
      
      console.log('Submitting profile data:', JSON.stringify(profileData, null, 2));
      const success = await profileApi.updateData(profileData);
      
      if (success) {
        alert('Profile updated successfully');
        
        // Update saved values to match current values
        setSavedValues({
          age,
          gender,
          medicalHistory,
          address,
          pinCode,
          city,
          medicalHistoryPdf
        });
        
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  // Handler for gender change - immediate update
  const handleGenderChange = async (value: string) => {
    // Update local state and savedValues simultaneously to prevent flickering
    setGender(value);
    setSavedValues(prev => ({
      ...prev,
      gender: value
    }));
    
    setUpdating(true);
    
    try {
      // Prepare profile data with the new gender value
      const profileData = prepareProfileData();
      // Use the new gender value since state might not be updated yet
      profileData.gender = value.toLowerCase();
      
      console.log('Immediately updating profile with new gender:', value);
      const success = await profileApi.updateData(profileData);
      
      if (!success) {
        console.error('Failed to update gender');
      }
    } catch (error) {
      console.error('Error updating gender:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Handler for city change - immediate update like gender
  const handleCityChange = async (value: string) => {
    // Update local state and savedValues simultaneously to prevent flickering
    setCity(value);
    setSavedValues(prev => ({
      ...prev,
      city: value
    }));
    
    setUpdating(true);
    
    try {
      // Prepare profile data with the new city value
      const profileData = prepareProfileData();
      // Use the new city value since state might not be updated yet
      profileData.city = value;
      
      console.log('Immediately updating profile with new city:', value);
      const success = await profileApi.updateData(profileData);
      
      if (!success) {
        console.error('Failed to update city');
      }
    } catch (error) {
      console.error('Error updating city:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Function to filter cities based on search text
  const filterCities = (searchText: string) => {
    if (!searchText) {
      setFilteredCities(cities);
      return;
    }
    
    try {
      // Try regex search first
      const regex = new RegExp(searchText, 'i');
      const matches = cities.filter(city => regex.test(city));
      setFilteredCities(matches);
    } catch (e) {
      // Fall back to simple contains search
      const matches = cities.filter(city => 
        city.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCities(matches);
    }
  };

  // Regular handlers for other fields (will show highlights and require save button)
  const handleAgeChange = (text: string) => {
    setAge(text);
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);
  };

  const handlePinCodeChange = (text: string) => {
    // Allow only digits and limit to 6 characters
    const formattedText = text.replace(/\D/g, '').substring(0, 6);
    setPinCode(formattedText);
  };

  const handleMedicalHistoryChange = (text: string) => {
    setMedicalHistory(text);
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
      city,
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
            city={city}
            medicalHistory={medicalHistory}
            medicalHistoryPdf={medicalHistoryPdf}
            uploadingPdf={uploadingPdf}
            cities={filteredCities.length > 0 ? filteredCities : cities}
            onChangeAge={handleAgeChange}
            onChangeGender={handleGenderChange}
            onChangeAddress={handleAddressChange}
            onChangePinCode={handlePinCodeChange}
            onChangeCity={handleCityChange}
            onChangeMedicalHistory={handleMedicalHistoryChange}
            onDocumentPick={handleDocumentPick}
            savedValues={savedValues}
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
            onLogout={handleLogout}
          />
          
          {/* Dynamic Form Section based on role */}
          {renderProfileForm()}
        </ScrollView>
      </SafeAreaView>

      {/* Floating Save Button (only show when there are changes) */}
      {displayRole === UserRole.USER && hasUnsavedChanges && (
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
