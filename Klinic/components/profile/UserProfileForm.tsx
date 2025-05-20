import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Picker } from '@react-native-picker/picker';
import CitySearch from './CitySearch';
import { UserRole } from '@/types/userTypes';

interface UserProfileFormProps {
  age: string;
  gender: string;
  address: string;
  pinCode: string;
  city: string;
  medicalHistory: string;
  medicalHistoryPdfs: string[] | null;
  uploadingPdf: boolean;
  cities: string[];
  userRole?: UserRole;
  onChangeAge: (text: string) => void;
  onChangeGender: (gender: string) => void;
  onChangeAddress: (text: string) => void;
  onChangePinCode: (text: string) => void;
  onChangeCity: (city: string) => void;
  onChangeMedicalHistory: (text: string) => void;
  onDocumentPick: () => void;
  onDocumentDelete: (index: number) => void;
  savedValues: {
    age: string;
    gender: string;
    address: string;
    pinCode: string;
    city: string;
    medicalHistory: string;
    medicalHistoryPdfs: string[];
  };
}

const UserProfileForm = ({
  age,
  gender,
  address,
  pinCode,
  city,
  medicalHistory,
  medicalHistoryPdfs,
  uploadingPdf,
  cities,
  userRole = UserRole.USER,
  onChangeAge,
  onChangeGender,
  onChangeAddress,
  onChangePinCode,
  onChangeCity,
  onChangeMedicalHistory,
  onDocumentPick,
  onDocumentDelete,
  savedValues
}: UserProfileFormProps) => {
  const genderOptions = ['Male', 'Female'];
  const isDeliveryPartner = userRole === UserRole.DELIVERY_BOY;

  // Function to open PDF externally
  const openPdfExternally = (pdfUrl: string) => {
    if (pdfUrl) {
      Linking.openURL(pdfUrl)
        .catch(err => console.error('Error opening PDF:', err));
    }
  };

  // Check if fields have unsaved changes
  const isAgeChanged = age !== savedValues.age;
  const isGenderChanged = gender !== savedValues.gender;
  const isAddressChanged = address !== savedValues.address;
  const isPinCodeChanged = pinCode !== savedValues.pinCode;
  const isCityChanged = city !== savedValues.city;
  const isMedicalHistoryChanged = medicalHistory !== savedValues.medicalHistory;
  const isPdfsChanged = JSON.stringify(medicalHistoryPdfs) !== JSON.stringify(savedValues.medicalHistoryPdfs);

  return (
    <View>
      {/* Message about unsaved changes - Moved to top */}
      {(isAgeChanged || isGenderChanged || isAddressChanged || isPinCodeChanged || isCityChanged || 
        (!isDeliveryPartner && (isMedicalHistoryChanged || isPdfsChanged))) && (
        <View className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl">
          <Text className="text-red-600 text-sm">
            Fields with red highlights have unsaved changes. Click the "Save Changes" button to save your updates.
          </Text>
        </View>
      )}

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
                className={`mr-2 px-4 py-2.5 rounded-xl border ${
                  gender === option 
                    ? isGenderChanged 
                      ? 'bg-red-400 border-red-400' 
                      : 'bg-primary border-primary' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`${
                    gender === option ? 'text-white' : 'text-gray-800'
                  } font-medium text-center`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Pin Code and City in the same row */}
      <View className="flex-row mb-6 gap-3">
        {/* Pin Code Field */}
        <View className="flex-1">
          <Text className="text-gray-700 font-medium text-base mb-2">
            Pin Code
            {isPinCodeChanged && <Text className="text-red-500 ml-1">*</Text>}
          </Text>
          <View className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isPinCodeChanged ? 'border-red-400' : 'border-gray-200'}`}>
            <MaterialCommunityIcons 
              name="map-marker-radius" 
              size={22} 
              color={isPinCodeChanged ? "#F87171" : "#6366F1"} 
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={pinCode}
              onChangeText={onChangePinCode}
              placeholder="Enter your area pin code"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              maxLength={6}
              className="flex-1 text-gray-800"
            />
          </View>
        </View>

        {/* City Selector - replaced with CitySearch component */}
        <View className="flex-1">
          <CitySearch
            allCities={cities}
            selectedCity={city}
            onCitySelect={onChangeCity}
            isCityChanged={isCityChanged}
          />
        </View>
      </View>

      {/* Address Field - moved below pin code & city */}
      <View className="mb-6">
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
            value={address}
            onChangeText={onChangeAddress}
            placeholder="Enter your address"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            className="flex-1 text-gray-800 min-h-[80px]"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
      </View>

      {/* Medical History Fields - Only show for non-delivery partners */}
      {!isDeliveryPartner && (
        <>
          {/* Medical History Field */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium text-base mb-2">
              Medical History
              {isMedicalHistoryChanged && <Text className="text-red-500 ml-1">*</Text>}
            </Text>
            <View className={`flex-row items-start border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isMedicalHistoryChanged ? 'border-red-400' : 'border-gray-200'}`}>
              <MaterialCommunityIcons 
                name="medical-bag" 
                size={22}
                color={isMedicalHistoryChanged ? "#F87171" : "#6366F1"} 
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <TextInput
                value={medicalHistory}
                onChangeText={onChangeMedicalHistory}
                placeholder="Enter your medical history"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                className="flex-1 text-gray-800 min-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />
            </View>
          </View>

          {/* Medical History PDFs Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700 font-medium text-base">
                Medical History PDFs
                {isPdfsChanged && <Text className="text-red-500 ml-1">*</Text>}
              </Text>
              <TouchableOpacity
                onPress={onDocumentPick}
                disabled={uploadingPdf}
                className="flex-row items-center bg-primary px-3 py-1.5 rounded-lg"
              >
                <MaterialCommunityIcons name="plus" size={20} color="white" />
                <Text className="text-white font-medium ml-1">Add PDF</Text>
              </TouchableOpacity>
            </View>

            {/* PDF List */}
            <ScrollView className="max-h-[200px]">
              {medicalHistoryPdfs?.map((pdf, index) => (
                <View 
                  key={index}
                  className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 bg-white shadow-sm ${isPdfsChanged ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <View className="flex-row items-center flex-1">
                    <MaterialCommunityIcons
                      name="file-pdf-box"
                      size={22}
                      color={isPdfsChanged ? "#F87171" : "#6366F1"}
                      style={{ marginRight: 12 }}
                    />
                    <Text className="text-gray-800 flex-1" numberOfLines={1}>
                      PDF {index + 1}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <TouchableOpacity 
                      onPress={() => openPdfExternally(pdf)}
                      className="mr-2 p-2"
                    >
                      <MaterialCommunityIcons name="eye" size={20} color="#6366F1" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => onDocumentDelete(index)}
                      className="p-2"
                    >
                      <MaterialCommunityIcons name="close-circle" size={20} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            {uploadingPdf && (
              <View className="mt-2 flex-row items-center">
                <ActivityIndicator size="small" color="#6366F1" />
                <Text className="text-gray-500 ml-2">Uploading PDF...</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
};

export default UserProfileForm; 