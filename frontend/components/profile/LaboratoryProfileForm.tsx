import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Switch, Modal } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
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
    isAvailable,
    availableDays,
    availableSlots,
    setLaboratoryName,
    setLaboratoryPhone,
    setLaboratoryEmail,
    setLaboratoryWebsite,
    setLaboratoryAddress,
    setLaboratoryPinCode,
    setLaboratoryCity,
    setLaboratoryGoogleMapsLink,
    setIsAvailable,
    toggleAvailableDay,
    addAvailableSlot,
    removeAvailableSlot,
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
  const isAvailableChanged = isAvailable !== savedValues.isAvailable;
  const isAvailableDaysChanged = JSON.stringify(availableDays) !== JSON.stringify(savedValues.availableDays);
  const isAvailableSlotsChanged = JSON.stringify(availableSlots) !== JSON.stringify(savedValues.availableSlots);

  // Time slot picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end'>('start');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  // Custom time picker state
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [tempHour, setTempHour] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempAmPm, setTempAmPm] = useState('AM');

  const dayOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Function to format existing time slots (if they're in 24-hour format)
  const formatTimeSlot = (slot: string): string => {
    if (!slot.includes('AM') && !slot.includes('PM')) {
      // Assume this is in 24-hour format
      const [startTime24, endTime24] = slot.split('-');
      
      if (startTime24 && endTime24) {
        // Convert start time
        const [startHour, startMinute] = startTime24.split(':').map(Number);
        const startAMPM = startHour >= 12 ? 'PM' : 'AM';
        const formattedStartHour = startHour % 12 || 12;
        const formattedStartTime = `${formattedStartHour}:${startMinute < 10 ? '0' + startMinute : startMinute} ${startAMPM}`;
        
        // Convert end time
        const [endHour, endMinute] = endTime24.split(':').map(Number);
        const endAMPM = endHour >= 12 ? 'PM' : 'AM';
        const formattedEndHour = endHour % 12 || 12;
        const formattedEndTime = `${formattedEndHour}:${endMinute < 10 ? '0' + endMinute : endMinute} ${endAMPM}`;
        
        return `${formattedStartTime}-${formattedEndTime}`;
      }
    }
    
    // Already in 12-hour format or couldn't parse
    return slot;
  };

  // Function to add time slot
  const handleAddTimeSlot = () => {
    if (startTime && endTime) {
      const timeSlot = `${startTime}-${endTime}`;
      addAvailableSlot(timeSlot);
      setStartTime('');
      setEndTime('');
    } else {
      alert('Please select both start and end times');
    }
  };

  // Function to handle time selection from custom picker
  const handleTimeSelected = () => {
    // Format time in 12-hour format with AM/PM
    const formattedHours = tempHour;
    const formattedMinutes = tempMinute < 10 ? `0${tempMinute}` : `${tempMinute}`;
    const timeString = `${formattedHours}:${formattedMinutes} ${tempAmPm}`;
    
    if (timePickerMode === 'start') {
      setStartTime(timeString);
    } else {
      setEndTime(timeString);
    }
    
    setShowCustomTimePicker(false);
  };

  // Legacy time change handler for DateTimePicker
  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      setSelectedTime(selectedDate);
      
      // Format time in 12-hour format with AM/PM
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
      
      if (timePickerMode === 'start') {
        setStartTime(timeString);
      } else {
        setEndTime(timeString);
      }
    }
  };

  // Open custom time picker
  const openCustomTimePicker = (mode: 'start' | 'end') => {
    setTimePickerMode(mode);
    
    // Set initial values based on current time or existing selected time
    const now = new Date();
    let initialHour = now.getHours();
    const initialMinute = now.getMinutes();
    const initialAmPm = initialHour >= 12 ? 'PM' : 'AM';
    initialHour = initialHour % 12 || 12; // Convert to 12-hour format
    
    setTempHour(initialHour);
    setTempMinute(initialMinute);
    setTempAmPm(initialAmPm);
    
    setShowCustomTimePicker(true);
  };

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
          coverImage: savedValues.coverImage,
          isAvailable,
          availableDays,
          availableSlots
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
              coverImage: savedValues.coverImage,
              isAvailable,
              availableDays,
              availableSlots
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
        isGoogleMapsLinkChanged || areServicesChanged || isAvailableChanged || 
        isAvailableDaysChanged || isAvailableSlotsChanged) {
      autoSaveChanges();
    }
  }, [
    laboratoryName, laboratoryPhone, laboratoryEmail, laboratoryWebsite,
    laboratoryAddress, laboratoryPinCode, laboratoryCity, laboratoryGoogleMapsLink, 
    laboratoryServices, isAvailable, availableDays, availableSlots
  ]);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="p-4">
          {/* Message about unsaved changes */}
          {(isNameChanged || isPhoneChanged || isEmailChanged || isWebsiteChanged || 
            isAddressChanged || isPinCodeChanged || isCityChanged || isGoogleMapsLinkChanged || 
            areServicesChanged || isAvailableChanged || isAvailableDaysChanged || isAvailableSlotsChanged) && (
            <View className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Text className="text-red-600 text-sm">
                Fields with red highlights have unsaved changes. Click the "Save Changes" button to save your updates.
              </Text>
            </View>
          )}

          {/* Availability Toggle */}
          <View className="mb-6 p-3 bg-white border border-gray-200 rounded-xl">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-800 font-medium text-base">
                  Available?
                  {isAvailableChanged && <Text className="text-red-500 ml-1">*</Text>}
                </Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: "#D1D5DB", true: "#C7D2FE" }}
                thumbColor={isAvailable ? "#6366F1" : "#9CA3AF"}
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </View>

          {/* Available Days Selection */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Available Days
              {isAvailableDaysChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`p-3 bg-white border rounded-xl ${isAvailableDaysChanged ? 'border-red-400' : 'border-gray-200'}`}>
              <View className="flex-row flex-wrap gap-2 mb-2">
                {dayOptions.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleAvailableDay(day)}
                    className={`py-2 px-3 rounded-lg border ${
                      availableDays.includes(day)
                        ? isAvailableDaysChanged
                          ? 'bg-red-400 border-red-400'
                          : 'bg-primary border-primary'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`${
                        availableDays.includes(day) ? 'text-white' : 'text-gray-800'
                      } text-center font-medium`}
                    >
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {availableDays.length === 0 && (
                <Text className="text-gray-500 text-center text-sm">
                  Select the days you are available
                </Text>
              )}
            </View>
          </View>

          {/* Time Slots */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Available Time Slots
              {isAvailableSlotsChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`p-3 bg-white border rounded-xl ${isAvailableSlotsChanged ? 'border-red-400' : 'border-gray-200'}`}>
              {/* Time slot picker */}
              <View className="mb-3">
                <View className="flex-row justify-between mb-2">
                  <TouchableOpacity
                    onPress={() => openCustomTimePicker('start')}
                    className="flex-1 mr-2 p-2 border border-gray-200 rounded-lg flex-row items-center"
                  >
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#6366F1" />
                    <Text className="ml-2 text-gray-800">
                      {startTime || 'Start Time'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => openCustomTimePicker('end')}
                    className="flex-1 ml-2 p-2 border border-gray-200 rounded-lg flex-row items-center"
                  >
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#6366F1" />
                    <Text className="ml-2 text-gray-800">
                      {endTime || 'End Time'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  onPress={handleAddTimeSlot}
                  disabled={!startTime || !endTime}
                  className={`p-2 rounded-lg ${
                    startTime && endTime ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <Text className={`text-center font-medium ${
                    startTime && endTime ? 'text-white' : 'text-gray-500'
                  }`}>
                    Add Time Slot
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* List of time slots */}
              <View>
                {availableSlots.length === 0 ? (
                  <Text className="text-gray-500 text-center py-2">No time slots added yet</Text>
                ) : (
                  <ScrollView style={{ maxHeight: 120 }} nestedScrollEnabled={true}>
                    {availableSlots.map((slot, index) => (
                      <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="clock" size={16} color="#6366F1" />
                          <Text className="text-gray-800 ml-2">{formatTimeSlot(slot)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeAvailableSlot(slot)}>
                          <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>

          {/* Custom Time Picker Modal - better visibility and UX */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showCustomTimePicker}
            onRequestClose={() => setShowCustomTimePicker(false)}
          >
            <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
              <View className="bg-white p-5 rounded-xl w-[320px] shadow-xl">
                <Text className="text-gray-800 font-bold text-lg text-center mb-5">
                  Select {timePickerMode === 'start' ? 'Start' : 'End'} Time
                </Text>
                
                <View className="flex-row justify-center items-center mb-6" style={{ marginHorizontal: -10 }}>
                  {/* Hour Picker */}
                  <View className="items-center" style={{ marginHorizontal: 5 }}>
                    <Text className="text-gray-600 font-medium mb-1">Hour</Text>
                    <View className="bg-gray-100 rounded-lg py-1">
                      <Picker
                        selectedValue={tempHour}
                        onValueChange={(value) => setTempHour(value)}
                        style={{ height: 120, width: 90 }}
                        itemStyle={{ color: '#000000', fontSize: 22 }}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                          <Picker.Item key={hour} label={hour.toString()} value={hour} color="#000000" />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  
                  {/* Minute Picker */}
                  <View className="items-center" style={{ marginHorizontal: 5 }}>
                    <Text className="text-gray-600 font-medium mb-1">Minute</Text>
                    <View className="bg-gray-100 rounded-lg py-1">
                      <Picker
                        selectedValue={tempMinute}
                        onValueChange={(value) => setTempMinute(value)}
                        style={{ height: 120, width: 90 }}
                        itemStyle={{ color: '#000000', fontSize: 22 }}
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                          <Picker.Item 
                            key={minute} 
                            label={minute < 10 ? `0${minute}` : minute.toString()} 
                            value={minute}
                            color="#000000"
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  
                  {/* AM/PM Picker */}
                  <View className="items-center" style={{ marginHorizontal: 5 }}>
                    <Text className="text-gray-600 font-medium mb-1">AM/PM</Text>
                    <View className="bg-gray-100 rounded-lg py-1">
                      <Picker
                        selectedValue={tempAmPm}
                        onValueChange={(value) => setTempAmPm(value)}
                        style={{ height: 120, width: 90 }}
                        itemStyle={{ color: '#000000', fontSize: 22 }}
                      >
                        <Picker.Item label="AM" value="AM" color="#000000" />
                        <Picker.Item label="PM" value="PM" color="#000000" />
                      </Picker>
                    </View>
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View className="flex-row justify-between mt-2">
                  <TouchableOpacity 
                    onPress={() => setShowCustomTimePicker(false)}
                    className="bg-gray-200 py-3 px-5 rounded-lg flex-1 mr-2"
                  >
                    <Text className="text-gray-800 font-medium text-center">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleTimeSelected}
                    className="bg-primary py-3 px-5 rounded-lg flex-1 ml-2"
                  >
                    <Text className="text-white font-medium text-center">Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
        </View>
      </KeyboardAvoidingView>

      {/* Add Service Modal */}
      <ServiceFormModal
        visible={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onSubmit={handleAddService}
        availableCategories={availableCategories}
      />
    </ScrollView>
  );
};

export default LaboratoryProfileForm; 