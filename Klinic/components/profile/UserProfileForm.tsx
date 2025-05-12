import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  onDocumentPick
}: UserProfileFormProps) => {
  const genderOptions = ['Male', 'Female'];

  return (
    <View>
      {/* Age and Gender in the same row */}
      <View className="flex-row mb-6 gap-3">
        {/* Age Input */}
        <View className="flex-1">
          <Text className="text-gray-700 font-medium text-base mb-2">Age</Text>
          <View className="flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm border-gray-200">
            <MaterialCommunityIcons 
              name="calendar-account" 
              size={22} 
              color="#6366F1" 
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
          <Text className="text-gray-700 font-medium text-base mb-2">Gender</Text>
          <View className="flex-row">
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => onChangeGender(option)}
                className={`mr-2 px-4 py-2.5 rounded-xl border ${
                  gender === option ? 'bg-primary border-primary' : 'bg-white border-gray-200'
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
        <Text className="text-gray-700 font-medium text-base mb-2">Address</Text>
        <View className="flex-row items-start border rounded-xl px-4 py-3.5 bg-white shadow-sm border-gray-200">
          <MaterialCommunityIcons 
            name="map-marker" 
            size={22} 
            color="#6366F1" 
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
        <Text className="text-gray-700 font-medium text-base mb-2">Pin Code</Text>
        <View className="flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm border-gray-200">
          <MaterialCommunityIcons 
            name="map-marker-radius" 
            size={22} 
            color="#6366F1" 
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
        <Text className="text-gray-700 font-medium text-base mb-2">Medical History</Text>
        <View className="flex-row items-start border rounded-xl px-4 py-3.5 bg-white shadow-sm border-gray-200">
          <MaterialCommunityIcons 
            name="medical-bag" 
            size={22} 
            color="#6366F1" 
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
        <Text className="text-gray-700 font-medium text-base mb-2">Medical History PDF</Text>
        <TouchableOpacity
          onPress={onDocumentPick}
          disabled={uploadingPdf}
          className="flex-row items-center border rounded-xl px-4 py-3.5 bg-white shadow-sm border-gray-200"
        >
          <MaterialCommunityIcons
            name="file-pdf-box"
            size={22}
            color="#6366F1"
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
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
            </View>
          ) : (
            <Text className="flex-1 text-gray-400">Upload medical history PDF</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Add extra space for the floating button */}
      <View className="h-20" />
    </View>
  );
};

export default UserProfileForm; 