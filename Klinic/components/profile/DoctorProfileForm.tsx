import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, Keyboard, Platform, Dimensions, Animated, KeyboardEvent, EmitterSubscription, FlatList, Switch, ScrollView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import CitySearch from './CitySearch';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DoctorProfileFormProps {
  description: string;
  experience: string;
  specializations: string[];
  availableSpecializations: string[];
  qualifications: string[];
  availableQualifications: string[];
  consultationFee: string;
  age: string;
  gender: string;
  consultationType: string;
  coverImage: string;
  clinicName: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicWebsite: string;
  clinicAddress: string;
  clinicPinCode: string;
  clinicCity: string;
  clinicGoogleMapsLink: string;
  cities: string[];
  isAvailable: boolean;
  availableDays: string[];
  availableSlots: string[];
  uploadingCoverImage: boolean;
  onChangeDescription: (text: string) => void;
  onChangeExperience: (text: string) => void;
  onAddSpecialization: (text: string) => void;
  onRemoveSpecialization: (index: number) => void;
  onAddQualification: (text: string) => void;
  onRemoveQualification: (index: number) => void;
  onChangeConsultationFee: (text: string) => void;
  onChangeAge: (text: string) => void;
  onChangeGender: (gender: string) => void;
  onChangeConsultationType: (type: string) => void;
  onChangeCoverImage: () => void;
  onChangeClinicName: (text: string) => void;
  onChangeClinicPhone: (text: string) => void;
  onChangeClinicEmail: (text: string) => void;
  onChangeClinicWebsite: (text: string) => void;
  onChangeClinicAddress: (text: string) => void;
  onChangeClinicPinCode: (text: string) => void;
  onChangeClinicCity: (city: string) => void;
  onChangeClinicGoogleMapsLink: (text: string) => void;
  onChangeIsAvailable: (value: boolean) => void;
  onToggleAvailableDay: (day: string) => void;
  onAddAvailableSlot: (slot: string) => void;
  onRemoveAvailableSlot: (slot: string) => void;
  savedValues: {
    description: string;
    experience: string;
    specializations: string[];
    qualifications: string[];
    consultationFee: string;
    age: string;
    gender: string;
    consultationType: string;
    coverImage: string;
    clinicName: string;
    clinicPhone: string;
    clinicEmail: string;
    clinicWebsite: string;
    clinicAddress: string;
    clinicPinCode: string;
    clinicCity: string;
    clinicGoogleMapsLink: string;
    isAvailable: boolean;
    availableDays: string[];
    availableSlots: string[];
  };
}

const DoctorProfileForm = ({
  description,
  experience,
  specializations,
  availableSpecializations,
  qualifications,
  availableQualifications,
  consultationFee,
  age,
  gender,
  consultationType,
  coverImage,
  clinicName,
  clinicPhone,
  clinicEmail,
  clinicWebsite,
  clinicAddress,
  clinicPinCode,
  clinicCity,
  clinicGoogleMapsLink,
  cities,
  isAvailable,
  availableDays,
  availableSlots,
  uploadingCoverImage,
  onChangeDescription,
  onChangeExperience,
  onAddSpecialization,
  onRemoveSpecialization,
  onAddQualification,
  onRemoveQualification,
  onChangeConsultationFee,
  onChangeAge,
  onChangeGender,
  onChangeConsultationType,
  onChangeCoverImage,
  onChangeClinicName,
  onChangeClinicPhone,
  onChangeClinicEmail,
  onChangeClinicWebsite,
  onChangeClinicAddress,
  onChangeClinicPinCode,
  onChangeClinicCity,
  onChangeClinicGoogleMapsLink,
  onChangeIsAvailable,
  onToggleAvailableDay,
  onAddAvailableSlot,
  onRemoveAvailableSlot,
  savedValues
}: DoctorProfileFormProps) => {
  const genderOptions = ['Male', 'Female'];
  const consultationTypeOptions = ['in-person', 'online', 'both'];
  const dayOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const [newSpecialization, setNewSpecialization] = useState('');
  const [newQualification, setNewQualification] = useState('');
  const [showSpecializationSuggestions, setShowSpecializationSuggestions] = useState(false);
  const [showQualificationSuggestions, setShowQualificationSuggestions] = useState(false);
  const [filteredSpecializations, setFilteredSpecializations] = useState<string[]>([]);
  const [filteredQualifications, setFilteredQualifications] = useState<string[]>([]);
  
  // Time slot picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end'>('start');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Check if fields have unsaved changes
  const isDescriptionChanged = description !== savedValues.description;
  const isExperienceChanged = experience !== savedValues.experience;
  const isSpecializationsChanged = JSON.stringify(specializations) !== JSON.stringify(savedValues.specializations);
  const isQualificationsChanged = JSON.stringify(qualifications) !== JSON.stringify(savedValues.qualifications);
  const isConsultationFeeChanged = consultationFee !== savedValues.consultationFee;
  const isAgeChanged = age !== savedValues.age;
  const isGenderChanged = gender !== savedValues.gender;
  const isConsultationTypeChanged = consultationType !== savedValues.consultationType;
  const isCoverImageChanged = coverImage !== savedValues.coverImage;
  const isClinicNameChanged = clinicName !== savedValues.clinicName;
  const isClinicPhoneChanged = clinicPhone !== savedValues.clinicPhone;
  const isClinicEmailChanged = clinicEmail !== savedValues.clinicEmail;
  const isClinicWebsiteChanged = clinicWebsite !== savedValues.clinicWebsite;
  const isClinicAddressChanged = clinicAddress !== savedValues.clinicAddress;
  const isClinicPinCodeChanged = clinicPinCode !== savedValues.clinicPinCode;
  const isClinicCityChanged = clinicCity !== savedValues.clinicCity;
  const isClinicGoogleMapsLinkChanged = clinicGoogleMapsLink !== savedValues.clinicGoogleMapsLink;
  const isAvailableChanged = isAvailable !== savedValues.isAvailable;
  const isAvailableDaysChanged = JSON.stringify(availableDays) !== JSON.stringify(savedValues.availableDays);
  const isAvailableSlotsChanged = JSON.stringify(availableSlots) !== JSON.stringify(savedValues.availableSlots);

  // Check if any fields have unsaved changes
  const hasUnsavedChanges =
    isDescriptionChanged || isExperienceChanged || isSpecializationsChanged ||
    isQualificationsChanged || isConsultationFeeChanged || isAgeChanged ||
    isGenderChanged || isConsultationTypeChanged || isCoverImageChanged ||
    isClinicNameChanged || isClinicPhoneChanged || isClinicEmailChanged ||
    isClinicWebsiteChanged || isClinicAddressChanged || isClinicPinCodeChanged ||
    isClinicCityChanged || isClinicGoogleMapsLinkChanged || isAvailableChanged ||
    isAvailableDaysChanged || isAvailableSlotsChanged;

  // Function to filter specializations based on input
  useEffect(() => {
    if (!newSpecialization) {
      setFilteredSpecializations([]);
      setShowSpecializationSuggestions(false);
      return;
    }

    const search = newSpecialization.toLowerCase().trim();
    const filtered = availableSpecializations.filter(spec =>
      spec.toLowerCase().includes(search)
    );

    // Sort results by relevance (exact match first, then starts with, then includes)
    const sorted = [...filtered].sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();

      // Exact match comes first
      if (aLower === search) return -1;
      if (bLower === search) return 1;

      // Starts with comes next
      const aStartsWith = aLower.startsWith(search);
      const bStartsWith = bLower.startsWith(search);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Default to alphabetical
      return a.localeCompare(b);
    });

    setFilteredSpecializations(sorted);
    setShowSpecializationSuggestions(sorted.length > 0);

    // Log for debugging
    console.log(`Found ${sorted.length} matching specializations for "${search}"`);
  }, [newSpecialization, availableSpecializations]);

  // Function to filter qualifications based on input
  useEffect(() => {
    if (!newQualification) {
      setFilteredQualifications([]);
      setShowQualificationSuggestions(false);
      return;
    }

    const search = newQualification.toLowerCase().trim();
    const filtered = availableQualifications.filter(qual =>
      qual.toLowerCase().includes(search)
    );

    // Sort results by relevance (exact match first, then starts with, then includes)
    const sorted = [...filtered].sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();

      // Exact match comes first
      if (aLower === search) return -1;
      if (bLower === search) return 1;

      // Starts with comes next
      const aStartsWith = aLower.startsWith(search);
      const bStartsWith = bLower.startsWith(search);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Default to alphabetical
      return a.localeCompare(b);
    });

    setFilteredQualifications(sorted);
    setShowQualificationSuggestions(sorted.length > 0);

    // Log for debugging
    console.log(`Found ${sorted.length} matching qualifications for "${search}"`);
  }, [newQualification, availableQualifications]);

  const handleAddSpecialization = () => {
    if (newSpecialization.trim()) {
      // Check if this specialization already exists in the user's list
      if (specializations.includes(newSpecialization.trim())) {
        alert("This specialization is already in your list.");
        return;
      }

      onAddSpecialization(newSpecialization.trim());
      setNewSpecialization('');
      setShowSpecializationSuggestions(false);
      Keyboard.dismiss();
    }
  };

  const handleAddQualification = () => {
    if (newQualification.trim()) {
      // Check if this qualification already exists in the user's list
      if (qualifications.includes(newQualification.trim())) {
        alert("This qualification is already in your list.");
        return;
      }

      onAddQualification(newQualification.trim());
      setNewQualification('');
      setShowQualificationSuggestions(false);
      Keyboard.dismiss();
    }
  };

  // Select suggestion from available specializations
  const selectSpecialization = (specialization: string) => {
    onAddSpecialization(specialization);
    setNewSpecialization('');
    setShowSpecializationSuggestions(false);
  };

  // Select suggestion from available qualifications
  const selectQualification = (qualification: string) => {
    onAddQualification(qualification);
    setNewQualification('');
    setShowQualificationSuggestions(false);
  };

  // Function to handle time selection
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
      onAddAvailableSlot(timeSlot);
      setStartTime('');
      setEndTime('');
    } else {
      alert('Please select both start and end times');
    }
  };

  const { height, width } = Dimensions.get('window');

  const renderSpecializationSuggestions = () => {
    if (!showSpecializationSuggestions) return null;

    return (
      <View className="mb-3 border border-gray-200 rounded-lg max-h-32 overflow-hidden">
        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
          {filteredSpecializations.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => selectSpecialization(item)}
              className="px-3 py-2 border-b border-gray-100"
            >
              <Text className="text-gray-800">{item}</Text>
            </TouchableOpacity>
          ))}
          {filteredSpecializations.length === 0 && (
            <Text className="text-gray-500 text-center py-2">No matching specializations</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderQualificationSuggestions = () => {
    if (!showQualificationSuggestions) return null;

    return (
      <View className="mb-3 border border-gray-200 rounded-lg max-h-32 overflow-hidden">
        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
          {filteredQualifications.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => selectQualification(item)}
              className="px-3 py-2 border-b border-gray-100"
            >
              <Text className="text-gray-800">{item}</Text>
            </TouchableOpacity>
          ))}
          {filteredQualifications.length === 0 && (
            <Text className="text-gray-500 text-center py-2">No matching qualifications</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {/* Message about unsaved changes */}
        {hasUnsavedChanges && (
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
                Avilable?
                {isAvailableChanged && <Text className="text-red-500 ml-1">*</Text>}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={onChangeIsAvailable}
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
                  onPress={() => onToggleAvailableDay(day)}
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
                  onPress={() => {
                    setTimePickerMode('start');
                    setShowTimePicker(true);
                  }}
                  className="flex-1 mr-2 p-2 border border-gray-200 rounded-lg flex-row items-center"
                >
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#6366F1" />
                  <Text className="ml-2 text-gray-800">
                    {startTime || 'Start Time'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    setTimePickerMode('end');
                    setShowTimePicker(true);
                  }}
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
                      <TouchableOpacity onPress={() => onRemoveAvailableSlot(slot)}>
                        <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </View>

        {/* Cover Image Upload */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium text-base mb-2">
            Cover Image
            {isCoverImageChanged && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          <TouchableOpacity
            onPress={onChangeCoverImage}
            disabled={uploadingCoverImage}
            className={`flex items-center justify-center border-2 border-dashed rounded-xl bg-white ${isCoverImageChanged ? 'border-red-400' : 'border-gray-300'}`}
            style={{ height: 200 }}
          >
            {uploadingCoverImage ? (
              <View className="flex items-center">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="text-gray-500 mt-2">Uploading...</Text>
              </View>
            ) : coverImage ? (
              <Image
                source={{ uri: coverImage }}
                style={{ width: '100%', height: '100%', borderRadius: 10 }}
                resizeMode="cover"
              />
            ) : (
              <View className="flex items-center p-4">
                <MaterialCommunityIcons
                  name="image-plus"
                  size={48}
                  color="#6366F1"
                />
                <Text className="text-gray-500 mt-2">Upload clinic cover image</Text>
                <Text className="text-gray-400 text-xs mt-1">Tap to select an image</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Personal Information Section */}
        <View className="mb-6">
          <Text className="text-gray-800 font-bold text-lg mb-4">Personal Information</Text>

          {/* Age and Gender in the same row */}
          <View className="flex-row mb-6 gap-3">
            {/* Age Input */}
            <View className="flex-1">
              <Text className="text-gray-700 font-medium text-base mb-2">
                Age
                {isAgeChanged && <Text className="text-red-500 ml-1">*</Text>}
              </Text>
              <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isAgeChanged ? 'border-red-400' : 'border-gray-200'}`}>
                <MaterialCommunityIcons
                  name="calendar-account"
                  size={22}
                  color={isAgeChanged ? "#F87171" : "#6366F1"}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  value={age}
                  onChangeText={onChangeAge}
                  placeholder="Enter age"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="flex-1 text-gray-800"
                />
              </View>
            </View>

            {/* Gender Selection */}
            <View className="flex-1">
              <Text className="text-gray-700 font-medium text-base mb-2">
                Gender
                {isGenderChanged && <Text className="text-red-500 ml-1">*</Text>}
              </Text>
              <View className="flex-row">
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => onChangeGender(option)}
                    className={`mr-2 px-4 py-2.5 rounded-xl border ${gender === option
                      ? isGenderChanged
                        ? 'bg-red-400 border-red-400'
                        : 'bg-primary border-primary'
                      : 'bg-white border-gray-200'
                      }`}
                  >
                    <Text
                      className={`${gender === option ? 'text-white' : 'text-gray-800'
                        } font-medium text-center`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Professional Information Section */}
        <View className="mb-6">
          <Text className="text-gray-800 font-bold text-lg mb-4">Professional Information</Text>

          {/* Experience and Consultation Fee in the same row */}
          <View className="flex-row mb-6 gap-3">
            {/* Experience Input */}
            <View className="flex-1">
              <Text className="text-gray-700 font-medium text-base mb-2">
                Experience (years)
                {isExperienceChanged && <Text className="text-red-500 ml-1">*</Text>}
              </Text>
              <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isExperienceChanged ? 'border-red-400' : 'border-gray-200'}`}>
                <MaterialCommunityIcons
                  name="briefcase"
                  size={22}
                  color={isExperienceChanged ? "#F87171" : "#6366F1"}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  value={experience}
                  onChangeText={onChangeExperience}
                  placeholder="e.g., 5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="flex-1 text-gray-800"
                />
              </View>
            </View>

            {/* Consultation Fee Input */}
            <View className="flex-1">
              <Text className="text-gray-700 font-medium text-base mb-2">
                Consultation Fee (₹)
                {isConsultationFeeChanged && <Text className="text-red-500 ml-1">*</Text>}
              </Text>
              <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isConsultationFeeChanged ? 'border-red-400' : 'border-gray-200'}`}>
                <MaterialCommunityIcons
                  name="currency-inr"
                  size={22}
                  color={isConsultationFeeChanged ? "#F87171" : "#6366F1"}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  value={consultationFee}
                  onChangeText={onChangeConsultationFee}
                  placeholder="e.g., 500"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="flex-1 text-gray-800"
                />
              </View>
            </View>
          </View>

          {/* Description Field */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Professional Description
              {isDescriptionChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`flex-row items-start border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isDescriptionChanged ? 'border-red-400' : 'border-gray-200'}`}>
              <MaterialCommunityIcons
                name="card-account-details"
                size={22}
                color={isDescriptionChanged ? "#F87171" : "#6366F1"}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <TextInput
                value={description}
                onChangeText={onChangeDescription}
                placeholder="Describe your professional experience, expertise, and accomplishments. For example: 'I have 10 years of experience in psychology, specializing in cognitive behavioral therapy...'"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                keyboardType="default"
                returnKeyType="done"
                blurOnSubmit={true}
                className="flex-1 text-gray-800 min-h-[150px]"
                style={{ textAlignVertical: 'top' }}
                autoCorrect={false}
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              A detailed professional description helps patients understand your expertise and experience better.
            </Text>
          </View>

          {/* Consultation Type */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Consultation Type
              {isConsultationTypeChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`border rounded-xl bg-white shadow-sm overflow-hidden ${isConsultationTypeChanged ? 'border-red-400' : 'border-gray-200'}`}>
              {/* Replace Picker with buttons for better UX and reliability */}
              <View className="p-3">
                {consultationTypeOptions.map((option) => {
                  let displayLabel = option;
                  if (option === 'in-person') {
                    displayLabel = 'In-Person';
                  } else if (option === 'online') {
                    displayLabel = 'Online';
                  } else if (option === 'both') {
                    displayLabel = 'Both (Online & In-Person)';
                  }

                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => onChangeConsultationType(option)}
                      className={`mb-2 px-4 py-3 rounded-xl border ${consultationType === option
                        ? isConsultationTypeChanged
                          ? 'bg-red-400 border-red-400'
                          : 'bg-primary border-primary'
                        : 'bg-white border-gray-200'
                        }`}
                    >
                      <Text
                        className={`${consultationType === option ? 'text-white' : 'text-gray-800'
                          } font-medium text-center`}
                      >
                        {displayLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              {consultationType
                ? `Selected: ${consultationType === 'in-person'
                  ? 'In-Person'
                  : consultationType === 'online'
                    ? 'Online'
                    : 'Both (Online & In-Person)'}`
                : 'Please select a consultation type'}
            </Text>
          </View>

          {/* Specializations */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Specializations
              {isSpecializationsChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isSpecializationsChanged ? 'border-red-400' : 'border-gray-200'}`}>
              {/* Add specialization input */}
              <View className="flex-row items-center mb-3">
                <TextInput
                  value={newSpecialization}
                  onChangeText={setNewSpecialization}
                  placeholder="Add specialization (e.g., Cardiology)"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={handleAddSpecialization}
                  className="flex-1 border-b border-gray-200 pb-2 text-gray-800"
                />
                <TouchableOpacity
                  onPress={handleAddSpecialization}
                  className="ml-2 bg-primary rounded-full p-2"
                  disabled={!newSpecialization.trim()}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="white" />
                </TouchableOpacity>
              </View>

              {/* Specialization suggestions using render function */}
              {renderSpecializationSuggestions()}

              {/* List of specializations */}
              <View className="mt-2">
                {specializations.length === 0 ? (
                  <Text className="text-gray-400 text-center py-2">No specializations added yet</Text>
                ) : (
                  specializations.map((item, index) => (
                    <View key={index} className="flex-row items-center justify-between py-2 border-b border-gray-100">
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="stethoscope" size={16} color="#6366F1" />
                        <Text className="text-gray-800 ml-2">{item}</Text>
                      </View>
                      <TouchableOpacity onPress={() => onRemoveSpecialization(index)}>
                        <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>

          {/* Qualifications */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Qualifications
              {isQualificationsChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isQualificationsChanged ? 'border-red-400' : 'border-gray-200'}`}>
              {/* Add qualification input */}
              <View className="flex-row items-center mb-3">
                <TextInput
                  value={newQualification}
                  onChangeText={setNewQualification}
                  placeholder="Add qualification (e.g., MBBS, MD)"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={handleAddQualification}
                  className="flex-1 border-b border-gray-200 pb-2 text-gray-800"
                />
                <TouchableOpacity
                  onPress={handleAddQualification}
                  className="ml-2 bg-primary rounded-full p-2"
                  disabled={!newQualification.trim()}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="white" />
                </TouchableOpacity>
              </View>

              {/* Qualification suggestions using render function */}
              {renderQualificationSuggestions()}

              {/* List of qualifications */}
              <View className="mt-2">
                {qualifications.length === 0 ? (
                  <Text className="text-gray-400 text-center py-2">No qualifications added yet</Text>
                ) : (
                  qualifications.map((item, index) => (
                    <View key={index} className="flex-row items-center justify-between py-2 border-b border-gray-100">
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="school" size={16} color="#6366F1" />
                        <Text className="text-gray-800 ml-2">{item}</Text>
                      </View>
                      <TouchableOpacity onPress={() => onRemoveQualification(index)}>
                        <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Clinic Information */}
        <View className="mb-6">
          <Text className="text-gray-800 font-bold text-lg mb-4">Clinic Information</Text>

          {/* Clinic Name */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Clinic Name
              {isClinicNameChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isClinicNameChanged ? 'border-red-400' : 'border-gray-200'}`}>
              <MaterialCommunityIcons
                name="hospital-building"
                size={22}
                color={isClinicNameChanged ? "#F87171" : "#6366F1"}
                style={{ marginRight: 12 }}
              />
              <TextInput
                value={clinicName}
                onChangeText={onChangeClinicName}
                placeholder="Enter clinic name"
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-gray-800"
              />
            </View>
          </View>

          {/* Clinic Contact in the same row */}
          <View className="flex-row mb-6 gap-3">
            {/* Clinic Phone */}
            <View className="flex-1">
              <Text className="text-gray-700 font-medium text-base mb-2">
                Clinic Phone
                {isClinicPhoneChanged && <Text className="text-red-500 ml-1">*</Text>}
              </Text>
              <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isClinicPhoneChanged ? 'border-red-400' : 'border-gray-200'}`}>
                <MaterialCommunityIcons
                  name="phone"
                  size={22}
                  color={isClinicPhoneChanged ? "#F87171" : "#6366F1"}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  value={clinicPhone}
                  onChangeText={onChangeClinicPhone}
                  placeholder="e.g., 9876543210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  className="flex-1 text-gray-800"
                />
              </View>
            </View>

            {/* Clinic Email */}
            <View className="flex-1">
              <Text className="text-gray-700 font-medium text-base mb-2">
                Clinic Email
                {isClinicEmailChanged && <Text className="text-red-500 ml-1">*</Text>}
              </Text>
              <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isClinicEmailChanged ? 'border-red-400' : 'border-gray-200'}`}>
                <MaterialCommunityIcons
                  name="email"
                  size={22}
                  color={isClinicEmailChanged ? "#F87171" : "#6366F1"}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  value={clinicEmail}
                  onChangeText={onChangeClinicEmail}
                  placeholder="e.g., clinic@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  className="flex-1 text-gray-800"
                />
              </View>
            </View>
          </View>

          {/* Clinic Website */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Clinic Website
              {isClinicWebsiteChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isClinicWebsiteChanged ? 'border-red-400' : 'border-gray-200'}`}>
              <MaterialCommunityIcons
                name="web"
                size={22}
                color={isClinicWebsiteChanged ? "#F87171" : "#6366F1"}
                style={{ marginRight: 12 }}
              />
              <TextInput
                value={clinicWebsite}
                onChangeText={onChangeClinicWebsite}
                placeholder="e.g., https://www.example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                className="flex-1 text-gray-800"
              />
            </View>
          </View>

          {/* Clinic Pin Code and City */}
          <View className="flex-row mb-6 gap-3">
            {/* Clinic Pin Code */}
            <View className="flex-1">
              <Text className="text-gray-700 font-medium text-base mb-2">
                Clinic Pin Code
                {isClinicPinCodeChanged && <Text className="text-red-500 ml-1">*</Text>}
              </Text>
              <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isClinicPinCodeChanged ? 'border-red-400' : 'border-gray-200'}`}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={22}
                  color={isClinicPinCodeChanged ? "#F87171" : "#6366F1"}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  value={clinicPinCode}
                  onChangeText={onChangeClinicPinCode}
                  placeholder="Enter clinic pin code"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={6}
                  className="flex-1 text-gray-800"
                />
              </View>
            </View>

            {/* Clinic City */}
            <View className="flex-1">
              <CitySearch
                allCities={cities}
                selectedCity={clinicCity}
                onCitySelect={onChangeClinicCity}
                isCityChanged={isClinicCityChanged}
              />
            </View>
          </View>

          {/* Google Maps Link */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Google Maps Link
              {isClinicGoogleMapsLinkChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isClinicGoogleMapsLinkChanged ? 'border-red-400' : 'border-gray-200'}`}>
              <MaterialCommunityIcons
                name="google-maps"
                size={22}
                color={isClinicGoogleMapsLinkChanged ? "#F87171" : "#6366F1"}
                style={{ marginRight: 12 }}
              />
              <TextInput
                value={clinicGoogleMapsLink}
                onChangeText={onChangeClinicGoogleMapsLink}
                placeholder="Paste Google Maps link for your clinic"
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                className="flex-1 text-gray-800"
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              Add a Google Maps link to help patients find your clinic easily
            </Text>
          </View>

          {/* Clinic Address */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Clinic Address
              {isClinicAddressChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`flex-row items-start border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isClinicAddressChanged ? 'border-red-400' : 'border-gray-200'}`}>
              <MaterialCommunityIcons
                name="map-marker"
                size={22}
                color={isClinicAddressChanged ? "#F87171" : "#6366F1"}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <TextInput
                value={clinicAddress}
                onChangeText={onChangeClinicAddress}
                placeholder="Enter clinic address"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                keyboardType="default"
                returnKeyType="done"
                blurOnSubmit={true}
                className="flex-1 text-gray-800 min-h-[80px]"
                style={{ textAlignVertical: 'top' }}
                autoCorrect={false}
              />
            </View>
          </View>
        </View>
      </View>
      
      {/* Time Picker Modal */}
      {showTimePicker && (
        Platform.OS === 'ios' ? (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showTimePicker}
          >
            <View className="flex-1 justify-end bg-black bg-opacity-50">
              <View className="bg-white p-4 rounded-t-xl">
                <View className="flex-row justify-between items-center mb-4">
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text className="text-primary font-medium">Cancel</Text>
                  </TouchableOpacity>
                  <Text className="font-medium text-gray-800">
                    Select {timePickerMode === 'start' ? 'Start' : 'End'} Time
                  </Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text className="text-primary font-medium">Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  onChange={onTimeChange}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={onTimeChange}
          />
        )
      )}
    </View>
  );
};

export default DoctorProfileForm; 