import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useLaboratoryProfileStore, useProfileUIStore } from '../../store/profileStore';
import ServiceCard from './laboratory/ServiceCard';
import ServiceFormModal from './laboratory/ServiceFormModal';
import { LaboratoryService, LaboratoryTest } from '../../types/laboratoryTypes';
import useProfileApi from '../../hooks/useProfileApi';
import CitySearch from './CitySearch';

// Update property to include cover image picker
interface LaboratoryProfileFormProps {
  availableCategories?: string[];
  onServiceCoverImagePick?: (serviceId: string) => void;
}

const LaboratoryProfileForm = ({ 
  availableCategories = [],
  onServiceCoverImagePick
}: LaboratoryProfileFormProps) => {
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  
  // Add debounce timer ref with correct type
  const debounceTimerRef = useRef<number | null>(null);
  
  // Get state from stores
  const {
    laboratoryName,
    laboratoryPhone,
    laboratoryEmail,
    laboratoryWebsite,
    laboratoryAddress,
    laboratoryPinCode,
    laboratoryCity,
    laboratoryGoogleMapsLink,
    laboratoryServices,
    setLaboratoryName,
    setLaboratoryPhone,
    setLaboratoryEmail,
    setLaboratoryWebsite,
    setLaboratoryAddress,
    setLaboratoryPinCode,
    setLaboratoryCity,
    setLaboratoryGoogleMapsLink,
    addLaboratoryService,
    updateLaboratoryService,
    removeLaboratoryService,
    addTest,
    updateTest,
    removeTest,
    prepareProfileData,
    setSavedValues,
    savedValues
  } = useLaboratoryProfileStore();

  const uiStore = useProfileUIStore();

  // API hook for laboratory profile
  const laboratoryProfileApi = useProfileApi({
    endpoint: '/api/v1/laboratory-profile'
  });

  // Check which fields have changed for highlighting
  const isNameChanged = laboratoryName !== savedValues.laboratoryName;
  const isPhoneChanged = laboratoryPhone !== savedValues.laboratoryPhone;
  const isEmailChanged = laboratoryEmail !== savedValues.laboratoryEmail;
  const isWebsiteChanged = laboratoryWebsite !== savedValues.laboratoryWebsite;
  const isAddressChanged = laboratoryAddress !== savedValues.laboratoryAddress;
  const isPinCodeChanged = laboratoryPinCode !== savedValues.laboratoryPinCode;
  const isCityChanged = laboratoryCity !== savedValues.laboratoryCity;
  const isGoogleMapsLinkChanged = laboratoryGoogleMapsLink !== savedValues.laboratoryGoogleMapsLink;
  const areServicesChanged = JSON.stringify(laboratoryServices) !== JSON.stringify(savedValues.laboratoryServices);

  // Function to handle service cover image upload
  const handleServiceCoverImagePick = (serviceId: string) => {
    if (onServiceCoverImagePick) {
      // Call the parent function with the service ID
      onServiceCoverImagePick(serviceId);
    }
  };

  // For new service modal with auto-save
  const handleAddService = async (service: { 
    name: string; 
    description: string; 
    collectionType: 'home' | 'lab' | 'both';
    price: string;
    category?: string;
    tests?: { name: string; description: string }[];
  }) => {
    try {
      // Create service object with empty coverImage
      const serviceWithCover = {
        ...service,
        coverImage: '' // Add empty cover image
      };
      
      // Add to store
      addLaboratoryService(serviceWithCover);
      setShowAddServiceModal(false);
      
      // Auto-save the changes
      await autoSaveChanges();
    } catch (error) {
      console.error('Error adding laboratory service:', error);
    }
  };

  // Update service with auto-save
  const handleUpdateService = async (serviceId: string, updates: Partial<Omit<LaboratoryService, 'id' | 'tests'>>) => {
    try {
      // Update in store
      updateLaboratoryService(serviceId, updates);
      
      // Auto-save the changes
      await autoSaveChanges();
    } catch (error) {
      console.error('Error updating laboratory service:', error);
    }
  };

  // Remove service with auto-save
  const handleRemoveService = async (serviceId: string) => {
    try {
      console.log(`Removing service with ID: ${serviceId}`);
      
      // Remove from store
      removeLaboratoryService(serviceId);
      
      // Verify service was removed from state
      console.log(`Services after removal: ${laboratoryServices.length}`);
      console.log(`Service IDs: ${laboratoryServices.map(s => s.id).join(', ')}`);
      
      // Instead of using debounced auto-save, immediately save the changes
      console.log('Immediately saving changes after service removal');
      
      // Prepare profile data
      const profileData = prepareProfileData();
      console.log('Laboratory services to save:', profileData.laboratoryServices.length);
      
      // Use direct update instead of silent update for better error handling
      const result = await laboratoryProfileApi.updateData(profileData);
      
      if (result) {
        console.log('Service removal saved successfully');
        // Update saved values after successful save
        setSavedValues({
          laboratoryName,
          laboratoryPhone,
          laboratoryEmail,
          laboratoryWebsite,
          laboratoryAddress,
          laboratoryPinCode,
          laboratoryCity,
          laboratoryGoogleMapsLink,
          laboratoryServices,
          coverImage: savedValues.coverImage
        });
      } else {
        console.error('Service removal save failed');
        alert('Failed to delete service. Please try again.');
      }
    } catch (error) {
      console.error('Error removing laboratory service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };

  // Add test with auto-save
  const handleAddTest = async (serviceId: string, test: Omit<LaboratoryTest, 'id'>) => {
    try {
      // Add to store
      addTest(serviceId, test);
      
      // Auto-save the changes
      await autoSaveChanges();
    } catch (error) {
      console.error('Error adding laboratory test:', error);
    }
  };

  // Update test with auto-save
  const handleUpdateTest = async (serviceId: string, testId: string, updates: Partial<Omit<LaboratoryTest, 'id'>>) => {
    try {
      // Update in store
      updateTest(serviceId, testId, updates);
      
      // Auto-save the changes
      await autoSaveChanges();
    } catch (error) {
      console.error('Error updating laboratory test:', error);
    }
  };

  // Remove test with auto-save
  const handleRemoveTest = async (serviceId: string, testId: string) => {
    try {
      // Remove from store
      removeTest(serviceId, testId);
      
      // Auto-save the changes
      await autoSaveChanges();
    } catch (error) {
      console.error('Error removing laboratory test:', error);
    }
  };

  // Auto-save with debounce
  const autoSaveChanges = async () => {
    try {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set a new timer to auto-save after a brief delay
      return new Promise<boolean>((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          console.log('Auto-saving laboratory profile...');
          
          const profileData = prepareProfileData();
          console.log('Laboratory services to save:', profileData.laboratoryServices.length);
          console.log('Laboratory services data:', JSON.stringify(profileData.laboratoryServices, null, 2));
          
          const result = await laboratoryProfileApi.updateDataSilent(profileData);
          
          if (result) {
            console.log('Auto-save completed successfully');
            // Update saved values after successful auto-save
            setSavedValues({
              laboratoryName,
              laboratoryPhone,
              laboratoryEmail,
              laboratoryWebsite,
              laboratoryAddress,
              laboratoryPinCode,
              laboratoryCity,
              laboratoryGoogleMapsLink,
              laboratoryServices,
              coverImage: savedValues.coverImage
            });
            resolve(true);
          } else {
            console.error('Auto-save failed - API returned false');
            resolve(false);
          }
        }, 1000) as unknown as number;
      });
    } catch (error) {
      console.error('Error auto-saving laboratory profile:', error);
      return false;
    }
  };

  // Auto-save when fields change
  useEffect(() => {
    if (isNameChanged || isPhoneChanged || isEmailChanged || isWebsiteChanged || 
        isAddressChanged || isPinCodeChanged || isCityChanged || 
        isGoogleMapsLinkChanged || areServicesChanged) {
      autoSaveChanges();
    }
  }, [
    laboratoryName, laboratoryPhone, laboratoryEmail, laboratoryWebsite,
    laboratoryAddress, laboratoryPinCode, laboratoryCity, laboratoryGoogleMapsLink, 
    laboratoryServices
  ]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={100}
    >
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Basic Details */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Laboratory Details
          </Text>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Laboratory Name
              {isNameChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <TextInput
              value={laboratoryName}
              onChangeText={setLaboratoryName}
              placeholder="Enter laboratory name"
              className={`border ${isNameChanged ? 'border-red-400' : 'border-gray-300'} rounded-xl p-3 text-gray-800 bg-white`}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Phone Number
              {isPhoneChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <TextInput
              value={laboratoryPhone}
              onChangeText={setLaboratoryPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              className={`border ${isPhoneChanged ? 'border-red-400' : 'border-gray-300'} rounded-xl p-3 text-gray-800 bg-white`}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Email Address
              {isEmailChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <TextInput
              value={laboratoryEmail}
              onChangeText={setLaboratoryEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              className={`border ${isEmailChanged ? 'border-red-400' : 'border-gray-300'} rounded-xl p-3 text-gray-800 bg-white`}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Website (Optional)
              {isWebsiteChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <TextInput
              value={laboratoryWebsite}
              onChangeText={setLaboratoryWebsite}
              placeholder="Enter website URL"
              keyboardType="url"
              autoCapitalize="none"
              className={`border ${isWebsiteChanged ? 'border-red-400' : 'border-gray-300'} rounded-xl p-3 text-gray-800 bg-white`}
            />
          </View>
        </View>
        
        {/* Address */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Laboratory Address
          </Text>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Address
              {isAddressChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <TextInput
              value={laboratoryAddress}
              onChangeText={setLaboratoryAddress}
              placeholder="Enter laboratory address"
              multiline
              numberOfLines={3}
              className={`border ${isAddressChanged ? 'border-red-400' : 'border-gray-300'} rounded-xl p-3 text-gray-800 bg-white`}
              style={{ textAlignVertical: 'top' }}
            />
          </View>
          
          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-gray-700 font-medium text-base mb-2">
                Pin Code
                {isPinCodeChanged && <Text className="text-red-500 ml-1">*</Text>}
              </Text>
              <TextInput
                value={laboratoryPinCode}
                onChangeText={setLaboratoryPinCode}
                placeholder="Enter PIN code"
                keyboardType="number-pad"
                className={`border ${isPinCodeChanged ? 'border-red-400' : 'border-gray-300'} rounded-xl p-3 text-gray-800 bg-white`}
              />
            </View>
            
            <View className="flex-1 ml-2">
              <CitySearch 
                selectedCity={laboratoryCity}
                onCitySelect={setLaboratoryCity}
                allCities={uiStore.cities}
                isCityChanged={isCityChanged}
              />
            </View>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Google Maps Link (Optional)
              {isGoogleMapsLinkChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <TextInput
              value={laboratoryGoogleMapsLink}
              onChangeText={setLaboratoryGoogleMapsLink}
              placeholder="Enter Google Maps link"
              autoCapitalize="none"
              className={`border ${isGoogleMapsLinkChanged ? 'border-red-400' : 'border-gray-300'} rounded-xl p-3 text-gray-800 bg-white`}
            />
          </View>
        </View>
        
        {/* Laboratory Services */}
        <View className="mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Laboratory Services
            </Text>
            <TouchableOpacity 
              className="bg-indigo-500 py-2 px-3 rounded-lg flex-row items-center"
              onPress={() => setShowAddServiceModal(true)}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-medium ml-1">Add Service</Text>
            </TouchableOpacity>
          </View>

          {/* Service List */}
          {laboratoryServices.length === 0 ? (
            <View className="bg-gray-50 rounded-xl p-6 items-center justify-center border border-gray-200">
              <MaterialIcons name="medical-services" size={40} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2 text-center">
                No laboratory services added yet.
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Click the "Add Service" button to add your first service.
              </Text>
            </View>
          ) : (
            <View>
              {laboratoryServices.map((service) => (
                <ServiceCard 
                  key={service.id}
                  service={service}
                  onUpdate={(updates) => handleUpdateService(service.id, updates)}
                  onDelete={() => handleRemoveService(service.id)}
                  onAddTest={(test) => handleAddTest(service.id, test)}
                  onUpdateTest={(testId, updates) => handleUpdateTest(service.id, testId, updates)}
                  onDeleteTest={(testId) => handleRemoveTest(service.id, testId)}
                  onUploadCoverImage={handleServiceCoverImagePick}
                  availableCategories={availableCategories}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Service Modal */}
      <ServiceFormModal
        visible={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onSubmit={handleAddService}
        availableCategories={availableCategories}
      />
    </KeyboardAvoidingView>
  );
};

export default LaboratoryProfileForm; 