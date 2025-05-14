import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface UserProfileFormProps {
  age: string;
  gender: string;
  address: string;
  pinCode: string;
  medicalHistory: string;
  medicalHistoryPdf: string;
  uploadingPdf: boolean;
  onChangeAge: (text: string) => void;
  onChangeGender: (gender: string) => void;
  onChangeAddress: (text: string) => void;
  onChangePinCode: (text: string) => void;
  onChangeMedicalHistory: (text: string) => void;
  onDocumentPick: () => void;
  savedValues: {
    age: string;
    gender: string;
    address: string;
    pinCode: string;
    medicalHistory: string;
    medicalHistoryPdf: string;
  };
}

const UserProfileForm = ({
  age,
  gender,
  address,
  pinCode,
  medicalHistory,
  medicalHistoryPdf,
  uploadingPdf,
  onChangeAge,
  onChangeGender,
  onChangeAddress,
  onChangePinCode,
  onChangeMedicalHistory,
  onDocumentPick,
  savedValues
}: UserProfileFormProps) => {
  const genderOptions = ['Male', 'Female'];

  // Function to open PDF externally
  const openPdfExternally = () => {
    if (medicalHistoryPdf) {
      Linking.openURL(medicalHistoryPdf)
        .catch(err => console.error('Error opening PDF:', err));
    }
  };

  // Check if fields have unsaved changes
  const isAgeChanged = age !== savedValues.age;
  const isGenderChanged = gender !== savedValues.gender;
  const isAddressChanged = address !== savedValues.address;
  const isPinCodeChanged = pinCode !== savedValues.pinCode;
  const isMedicalHistoryChanged = medicalHistory !== savedValues.medicalHistory;
  const isPdfChanged = medicalHistoryPdf !== savedValues.medicalHistoryPdf;

  return (
    <View>
      {/* Message about unsaved changes - Moved to top */}
      {(isAgeChanged || isGenderChanged || isAddressChanged || isPinCodeChanged || isMedicalHistoryChanged || isPdfChanged) && (
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

      {/* Address Field */}
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

      {/* Pin Code Field */}
      <View className="mb-6">
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

      {/* Medical History PDF Upload */}
      <View className="mb-6">
        <Text className="text-gray-700 font-medium text-base mb-2">
          Medical History PDF
          {isPdfChanged && <Text className="text-red-500 ml-1">*</Text>}
        </Text>
        <TouchableOpacity
          onPress={onDocumentPick}
          disabled={uploadingPdf}
          className={`flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm ${isPdfChanged ? 'border-red-400' : 'border-gray-200'}`}
        >
          <MaterialCommunityIcons
            name="file-pdf-box"
            size={22}
            color={isPdfChanged ? "#F87171" : "#6366F1"}
            style={{ marginRight: 12 }}
          />
          {uploadingPdf ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#6366F1" />
              <Text className="text-gray-500 ml-2">Uploading...</Text>
            </View>
          ) : medicalHistoryPdf ? (
            <View className="flex-row items-center justify-between flex-1">
              <Text className="text-gray-800">PDF uploaded successfully</Text>
              <MaterialCommunityIcons 
                name={isPdfChanged ? "alert-circle" : "check-circle"} 
                size={20} 
                color={isPdfChanged ? "#F87171" : "#10B981"} 
              />
            </View>
          ) : (
            <Text className="flex-1 text-gray-400">Upload medical history PDF</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* PDF Preview Section */}
      {medicalHistoryPdf ? (
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-700 font-medium text-base">PDF Preview</Text>
            <TouchableOpacity onPress={openPdfExternally} className="px-3 py-1 bg-primary rounded-lg">
              <Text className="text-white font-medium">Open Full PDF</Text>
            </TouchableOpacity>
          </View>
          <View 
            className={`border rounded-xl overflow-hidden bg-white shadow-sm ${isPdfChanged ? 'border-red-400' : 'border-gray-200'}`}
            style={{ height: 300 }} // Fixed height for the preview
          >
            <WebView
              source={{ uri: medicalHistoryPdf }}
              style={{ flex: 1 }}
              renderLoading={() => <ActivityIndicator size="large" color="#6366F1" />}
              startInLoadingState={true}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default UserProfileForm; 