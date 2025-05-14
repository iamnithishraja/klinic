import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useLaboratoryProfileStore } from '../../store/profileStore';
import ServiceCard from './laboratory/ServiceCard';
import ServiceFormModal from './laboratory/ServiceFormModal';
import { LaboratoryService } from '../../types/laboratoryTypes';

const LaboratoryProfileForm = () => {
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  
  // Get state from the store
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
    savedValues
  } = useLaboratoryProfileStore();

  // Check which fields have changed for highlighting
  const isNameChanged = laboratoryName !== savedValues.laboratoryName;
  const isPhoneChanged = laboratoryPhone !== savedValues.laboratoryPhone;
  const isEmailChanged = laboratoryEmail !== savedValues.laboratoryEmail;
  const isWebsiteChanged = laboratoryWebsite !== savedValues.laboratoryWebsite;
  const isAddressChanged = laboratoryAddress !== savedValues.laboratoryAddress;
  const isPinCodeChanged = laboratoryPinCode !== savedValues.laboratoryPinCode;
  const isCityChanged = laboratoryCity !== savedValues.laboratoryCity;
  const isGoogleMapsLinkChanged = laboratoryGoogleMapsLink !== savedValues.laboratoryGoogleMapsLink;

  // For new service modal
  const handleAddService = (service: { 
    name: string; 
    description: string; 
    coverImage: string;
    collectionType: 'home' | 'lab' | 'both';
    price: string;
  }) => {
    addLaboratoryService(service);
    setShowAddServiceModal(false);
  };

  return (
    <View className="mb-6">
      {/* Laboratory Details Section */}
      <View className="mb-6">
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Laboratory Details
        </Text>
        
        {/* Laboratory Name */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium text-base mb-2">
            Laboratory Name
            {isNameChanged && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isNameChanged ? 'border-red-400' : 'border-gray-200'}`}>
            <FontAwesome5 
              name="hospital" 
              size={18} 
              color={isNameChanged ? "#F87171" : "#6366F1"} 
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={laboratoryName}
              onChangeText={setLaboratoryName}
              placeholder="Enter laboratory name"
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-800"
            />
          </View>
        </View>

        {/* Laboratory Phone */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium text-base mb-2">
            Phone Number
            {isPhoneChanged && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isPhoneChanged ? 'border-red-400' : 'border-gray-200'}`}>
            <MaterialIcons 
              name="phone" 
              size={22} 
              color={isPhoneChanged ? "#F87171" : "#6366F1"} 
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={laboratoryPhone}
              onChangeText={setLaboratoryPhone}
              placeholder="Enter phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              className="flex-1 text-gray-800"
            />
          </View>
        </View>

        {/* Laboratory Email */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium text-base mb-2">
            Email Address
            {isEmailChanged && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isEmailChanged ? 'border-red-400' : 'border-gray-200'}`}>
            <MaterialCommunityIcons 
              name="email-outline" 
              size={22} 
              color={isEmailChanged ? "#F87171" : "#6366F1"} 
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={laboratoryEmail}
              onChangeText={setLaboratoryEmail}
              placeholder="Enter email address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 text-gray-800"
            />
          </View>
        </View>

        {/* Laboratory Website */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium text-base mb-2">
            Website (Optional)
            {isWebsiteChanged && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isWebsiteChanged ? 'border-red-400' : 'border-gray-200'}`}>
            <MaterialCommunityIcons 
              name="web" 
              size={22} 
              color={isWebsiteChanged ? "#F87171" : "#6366F1"} 
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={laboratoryWebsite}
              onChangeText={setLaboratoryWebsite}
              placeholder="Enter website URL"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              className="flex-1 text-gray-800"
            />
          </View>
        </View>
      </View>

      {/* Address Section */}
      <View className="mb-6">
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Laboratory Address
        </Text>
        
        {/* Laboratory Address */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium text-base mb-2">
            Address
            {isAddressChanged && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          <View className={`flex-row items-start border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isAddressChanged ? 'border-red-400' : 'border-gray-200'}`}>
            <MaterialCommunityIcons 
              name="map-marker" 
              size={22}
              color={isAddressChanged ? "#F87171" : "#6366F1"} 
              style={{ marginRight: 12, marginTop: 2 }}
            />
            <TextInput
              value={laboratoryAddress}
              onChangeText={setLaboratoryAddress}
              placeholder="Enter laboratory address"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              className="flex-1 text-gray-800 min-h-[80px]"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        </View>

        {/* Pin Code */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium text-base mb-2">
            Pin Code
            {isPinCodeChanged && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isPinCodeChanged ? 'border-red-400' : 'border-gray-200'}`}>
            <MaterialIcons 
              name="pin-drop" 
              size={22} 
              color={isPinCodeChanged ? "#F87171" : "#6366F1"} 
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={laboratoryPinCode}
              onChangeText={setLaboratoryPinCode}
              placeholder="Enter pin code"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              className="flex-1 text-gray-800"
            />
          </View>
        </View>

        {/* City */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium text-base mb-2">
            City
            {isCityChanged && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isCityChanged ? 'border-red-400' : 'border-gray-200'}`}>
            <MaterialCommunityIcons 
              name="city" 
              size={22} 
              color={isCityChanged ? "#F87171" : "#6366F1"} 
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={laboratoryCity}
              onChangeText={setLaboratoryCity}
              placeholder="Enter city"
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-800"
            />
          </View>
        </View>

        {/* Google Maps Link */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium text-base mb-2">
            Google Maps Link (Optional)
            {isGoogleMapsLinkChanged && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isGoogleMapsLinkChanged ? 'border-red-400' : 'border-gray-200'}`}>
            <MaterialIcons 
              name="map" 
              size={22} 
              color={isGoogleMapsLinkChanged ? "#F87171" : "#6366F1"} 
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={laboratoryGoogleMapsLink}
              onChangeText={setLaboratoryGoogleMapsLink}
              placeholder="Paste Google Maps link"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              className="flex-1 text-gray-800"
            />
          </View>
        </View>
      </View>

      {/* Laboratory Services Section */}
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
                onUpdate={(updates) => updateLaboratoryService(service.id, updates)}
                onDelete={() => removeLaboratoryService(service.id)}
                onAddTest={(test) => addTest(service.id, test)}
                onUpdateTest={(testId, updates) => updateTest(service.id, testId, updates)}
                onDeleteTest={(testId) => removeTest(service.id, testId)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Add Service Modal */}
      <ServiceFormModal
        visible={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onSubmit={handleAddService}
      />
    </View>
  );
};

export default LaboratoryProfileForm; 