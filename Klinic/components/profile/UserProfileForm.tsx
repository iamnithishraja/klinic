import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useRecoilValue } from 'recoil';
import { userAtom } from '@/store/userAtoms';
import apiClient from '@/api/client';
import FormInput from '@/components/FormInput';
import FormButton from '@/components/FormButton';
import FormSection from './FormSection';
import { Picker } from '@react-native-picker/picker';
import ErrorMessage from '@/components/ErrorMessage';

interface Address {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  pinCode?: string | null;
}

interface UserProfileData {
  _id?: string;
  profilePicture?: string | null;
  age?: number | null;
  gender?: string | null;
  medicalHistory?: string | null;
  medicalHistoryPdf?: string | null;
  address?: Address | null;
  [key: string]: any; // Add index signature for dynamic access
}

const UserProfileForm = () => {
  const user = useRecoilValue(userAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [profileData, setProfileData] = useState<UserProfileData>({
    profilePicture: null,
    age: null,
    gender: null,
    medicalHistory: null,
    medicalHistoryPdf: null,
    address: {
      address: null,
      pinCode: null,
    }
  });
  
  // Fetch existing profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/v1/profile/user-profile');
        if (response.data) {
          setProfileData(response.data);
        }
      } catch (error) {
        console.log('No existing profile found or error fetching');
        // It's okay if there's no profile yet
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      // Handle nested fields like address.pinCode
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  // Handle profile image upload
  const handleImageUpload = async () => {
    // This would typically use image picker and then upload to storage
    Alert.alert('Feature Coming Soon', 'Profile picture upload will be available soon');
  };
  
  // Handle medical history PDF upload
  const handlePdfUpload = async () => {
    // This would typically use document picker and then upload to storage
    Alert.alert('Feature Coming Soon', 'Medical history PDF upload will be available soon');
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.post('/api/v1/profile/user-profile', profileData);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Update the profile data with the response
      setProfileData(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {error ? <ErrorMessage message={error} /> : null}
      
      <FormSection title="Personal Information">
        <FormInput
          label="Age"
          value={profileData.age?.toString() || ''}
          onChangeText={(text) => handleInputChange('age', text ? parseInt(text) : null)}
          placeholder="Enter your age"
          iconName="calendar-outline"
          keyboardType="numeric"
        />
        
        <View className="mb-4">
          <FormInput
            label="Gender"
            value={profileData.gender || ''}
            onChangeText={(text) => handleInputChange('gender', text)}
            placeholder="Select gender"
            iconName="human-male-female"
            editable={false}
            onPress={() => {}}
          />
          <View className="border border-gray-300 rounded-md mt-2">
            <Picker
              selectedValue={profileData.gender || ''}
              onValueChange={(value) => handleInputChange('gender', value)}
            >
              <Picker.Item label="Select gender" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
            </Picker>
          </View>
        </View>
      </FormSection>
      
      <FormSection title="Medical Information">
        <FormInput
          label="Medical History"
          value={profileData.medicalHistory || ''}
          onChangeText={(text) => handleInputChange('medicalHistory', text)}
          placeholder="Enter your medical history"
          iconName="medical-bag"
          multiline={true}
          numberOfLines={4}
        />
        
        <View className="flex-row justify-between items-center mt-4">
          <FormInput
            label="Medical History PDF"
            value={profileData.medicalHistoryPdf ? 'PDF Uploaded' : 'No PDF'}
            onChangeText={(text) => {}}
            editable={false}
            iconName="file-document-outline"
            containerStyle="flex-1 mr-2"
          />
          <FormButton 
            title="Upload" 
            onPress={handlePdfUpload}
            style="mt-6 px-4 py-2"
          />
        </View>
      </FormSection>
      
      <FormSection title="Address Information">
        <FormInput
          label="Address"
          value={profileData.address?.address || ''}
          onChangeText={(text) => handleInputChange('address.address', text)}
          placeholder="Enter your address"
          iconName="map-marker-outline"
        />
        
        <FormInput
          label="Pin Code"
          value={profileData.address?.pinCode || ''}
          onChangeText={(text) => handleInputChange('address.pinCode', text)}
          placeholder="Enter your pin code"
          iconName="map-marker-radius-outline"
          keyboardType="numeric"
        />
      </FormSection>
      
      <FormButton
        title={success ? "Profile Updated!" : "Save Profile"}
        onPress={handleSubmit}
        loading={loading}
        style={success ? "bg-green-600" : ""}
      />
      
      <View className="h-10" />
    </ScrollView>
  );
};

export default UserProfileForm; 