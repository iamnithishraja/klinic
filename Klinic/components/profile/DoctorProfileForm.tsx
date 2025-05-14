import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, Keyboard, Platform, Dimensions, Animated, KeyboardEvent, EmitterSubscription, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import CitySearch from './CitySearch';

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
  cities: string[];
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
  cities,
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
  savedValues
}: DoctorProfileFormProps) => {
  const genderOptions = ['Male', 'Female'];
  const consultationTypeOptions = ['in-person', 'online', 'both'];

  const [newSpecialization, setNewSpecialization] = useState('');
  const [newQualification, setNewQualification] = useState('');
  const [showSpecializationSuggestions, setShowSpecializationSuggestions] = useState(false);
  const [showQualificationSuggestions, setShowQualificationSuggestions] = useState(false);
  const [filteredSpecializations, setFilteredSpecializations] = useState<string[]>([]);
  const [filteredQualifications, setFilteredQualifications] = useState<string[]>([]);

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

  // Check if any fields have unsaved changes
  const hasUnsavedChanges =
    isDescriptionChanged || isExperienceChanged || isSpecializationsChanged ||
    isQualificationsChanged || isConsultationFeeChanged || isAgeChanged ||
    isGenderChanged || isConsultationTypeChanged || isCoverImageChanged ||
    isClinicNameChanged || isClinicPhoneChanged || isClinicEmailChanged ||
    isClinicWebsiteChanged || isClinicAddressChanged || isClinicPinCodeChanged ||
    isClinicCityChanged;

  // Function to filter specializations based on input
  useEffect(() => {
    if (!newSpecialization) {
      setFilteredSpecializations([]);
      setShowSpecializationSuggestions(false);
      return;
    }

    const filtered = availableSpecializations.filter(spec =>
      spec.toLowerCase().includes(newSpecialization.toLowerCase())
    );
    setFilteredSpecializations(filtered);
    setShowSpecializationSuggestions(filtered.length > 0);
  }, [newSpecialization, availableSpecializations]);

  // Function to filter qualifications based on input
  useEffect(() => {
    if (!newQualification) {
      setFilteredQualifications([]);
      setShowQualificationSuggestions(false);
      return;
    }

    const filtered = availableQualifications.filter(qual =>
      qual.toLowerCase().includes(newQualification.toLowerCase())
    );
    setFilteredQualifications(filtered);
    setShowQualificationSuggestions(filtered.length > 0);
  }, [newQualification, availableQualifications]);

  const handleAddSpecialization = () => {
    if (newSpecialization.trim()) {
      onAddSpecialization(newSpecialization.trim());
      setNewSpecialization('');
      setShowSpecializationSuggestions(false);
      Keyboard.dismiss();
    }
  };

  const handleAddQualification = () => {
    if (newQualification.trim()) {
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

  const { height, width } = Dimensions.get('window');
  
  const renderSpecializationSuggestions = () => {
    if (!showSpecializationSuggestions) return null;
    
    return (
      <View className="mb-3 border border-gray-200 rounded-lg max-h-32 overflow-hidden">
        <FlatList
          data={filteredSpecializations}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => selectSpecialization(item)}
              className="px-3 py-2 border-b border-gray-100"
            >
              <Text className="text-gray-800">{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderQualificationSuggestions = () => {
    if (!showQualificationSuggestions) return null;
    
    return (
      <View className="mb-3 border border-gray-200 rounded-lg max-h-32 overflow-hidden">
        <FlatList
          data={filteredQualifications}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => selectQualification(item)}
              className="px-3 py-2 border-b border-gray-100"
            >
              <Text className="text-gray-800">{item}</Text>
            </TouchableOpacity>
          )}
        />
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
                  <Picker
                    selectedValue={consultationType}
                    onValueChange={(itemValue) => onChangeConsultationType(itemValue)}
                    style={{ height: 50 }}
                  >
                    <Picker.Item label="Select consultation type" value="" />
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
                        <Picker.Item 
                          key={option} 
                          label={displayLabel} 
                          value={option} 
                        />
                      );
                    })}
                  </Picker>
                </View>
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
    </View>
  );
};

export default DoctorProfileForm; 