import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDoctorStore } from '../../store/doctorStore';
import type { DoctorSearchFilters } from '../../services/doctorService';

interface DoctorFiltersProps {
  onApplyFilters: () => void;
  onClose: () => void;
}

export default function DoctorFilters({ onApplyFilters, onClose }: DoctorFiltersProps) {
  const { filters, availableFilters, setFilters, resetFilters, searchDoctors } = useDoctorStore();
  
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<DoctorSearchFilters>({ ...filters });
  
  // Modal states
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPinCodeModal, setShowPinCodeModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  
  // Fee range state
  const [minFee, setMinFee] = useState(localFilters.minFee?.toString() || '');
  const [maxFee, setMaxFee] = useState(localFilters.maxFee?.toString() || '');
  
  // Rating state
  const [minRating, setMinRating] = useState(localFilters.minRating?.toString() || '');
  
  // Pin code state
  const [pinCode, setPinCode] = useState(localFilters.pinCode || '');

  // Reset local filters when global filters change
  useEffect(() => {
    setLocalFilters({ ...filters });
    setMinFee(filters.minFee?.toString() || '');
    setMaxFee(filters.maxFee?.toString() || '');
    setMinRating(filters.minRating?.toString() || '');
    setPinCode(filters.pinCode || '');
  }, [filters]);

  const handleFilterChange = (key: keyof DoctorSearchFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveFeeRange = () => {
    const min = minFee ? parseInt(minFee, 10) : undefined;
    const max = maxFee ? parseInt(maxFee, 10) : undefined;
    
    setLocalFilters(prev => ({
      ...prev,
      minFee: min,
      maxFee: max
    }));
    
    setShowFeeModal(false);
  };
  
  const handleCancelFeeRange = () => {
    setMinFee(localFilters.minFee?.toString() || '');
    setMaxFee(localFilters.maxFee?.toString() || '');
    setShowFeeModal(false);
  };
  
  const handleSaveRating = () => {
    const min = minRating ? parseInt(minRating, 10) : undefined;
    
    setLocalFilters(prev => ({
      ...prev,
      minRating: min
    }));
    
    setShowRatingModal(false);
  };
  
  const handleCancelRating = () => {
    setMinRating(localFilters.minRating?.toString() || '');
    setShowRatingModal(false);
  };
  
  const handleSavePinCode = () => {
    setLocalFilters(prev => ({
      ...prev,
      pinCode: pinCode || undefined
    }));
    
    setShowPinCodeModal(false);
  };
  
  const handleCancelPinCode = () => {
    setPinCode(localFilters.pinCode || '');
    setShowPinCodeModal(false);
  };

  const handleApplyFilters = () => {
    // Always reset to page 1 when applying filters
    setFilters({...localFilters, page: 1});
    onApplyFilters();
  };

  const handleResetFilters = () => {
    resetFilters();
    // After resetting filters, explicitly search with page 1
    searchDoctors({page: 1});
    onClose();
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="pt-12 pb-4 px-4 flex-row justify-between items-center border-b border-divider">
        <Text className="text-xl font-bold text-text-primary">Filter Doctors</Text>
        <TouchableOpacity onPress={onClose} className="p-2 rounded-full">
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {/* City Filter */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3 text-text-primary">City</Text>
          <TouchableOpacity 
            className="flex-row justify-between items-center border border-divider rounded-lg p-4 bg-background"
            onPress={() => setShowCityModal(true)}
          >
            <Text className="text-base text-text-primary">
              {localFilters.city || 'All Cities'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          
          {/* City Dropdown Modal */}
          <Modal
            visible={showCityModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCityModal(false)}
          >
            <View className="flex-1 bg-black/60 justify-center items-center">
              <View className="w-[90%] bg-surface rounded-xl p-5 shadow-lg max-h-[70%]">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-lg font-bold text-text-primary">Select City</Text>
                  <TouchableOpacity onPress={() => setShowCityModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView className="max-h-[400px]">
                  <TouchableOpacity 
                    className={`p-4 rounded-lg mb-2 ${!localFilters.city ? 'bg-primary' : 'bg-background border border-divider'}`}
                    onPress={() => {
                      handleFilterChange('city', '');
                      setShowCityModal(false);
                    }}
                  >
                    <Text className={`text-base font-semibold ${!localFilters.city ? 'text-white' : 'text-text-primary'}`}>All Cities</Text>
                  </TouchableOpacity>
                  
                  {/* Remove duplicate cities before mapping */}
                  {[...new Set(availableFilters.cities)].map((city, index) => (
                    <TouchableOpacity 
                      key={`city-${index}-${city}`}
                      className={`p-4 rounded-lg mb-2 ${localFilters.city === city ? 'bg-primary' : 'bg-background border border-divider'}`}
                      onPress={() => {
                        handleFilterChange('city', city);
                        setShowCityModal(false);
                      }}
                    >
                      <Text className={`text-base font-semibold ${localFilters.city === city ? 'text-white' : 'text-text-primary'}`}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>

        {/* Specialization Filter */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3 text-text-primary">Specialization</Text>
          <TouchableOpacity 
            className="flex-row justify-between items-center border border-divider rounded-lg p-4 bg-background"
            onPress={() => setShowSpecializationModal(true)}
          >
            <Text className="text-base text-text-primary">
              {localFilters.specialization || 'All Specializations'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          
          {/* Specialization Dropdown Modal */}
          <Modal
            visible={showSpecializationModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowSpecializationModal(false)}
          >
            <View className="flex-1 bg-black/60 justify-center items-center">
              <View className="w-[90%] bg-surface rounded-xl p-5 shadow-lg max-h-[70%]">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-lg font-bold text-text-primary">Select Specialization</Text>
                  <TouchableOpacity onPress={() => setShowSpecializationModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView className="max-h-[400px]">
                  <TouchableOpacity 
                    className={`p-4 rounded-lg mb-2 ${!localFilters.specialization ? 'bg-primary' : 'bg-background border border-divider'}`}
                    onPress={() => {
                      handleFilterChange('specialization', '');
                      setShowSpecializationModal(false);
                    }}
                  >
                    <Text className={`text-base font-semibold ${!localFilters.specialization ? 'text-white' : 'text-text-primary'}`}>All Specializations</Text>
                  </TouchableOpacity>
                  
                  {availableFilters.specializations.map((specialization) => (
                    <TouchableOpacity 
                      key={specialization}
                      className={`p-4 rounded-lg mb-2 ${localFilters.specialization === specialization ? 'bg-primary' : 'bg-background border border-divider'}`}
                      onPress={() => {
                        handleFilterChange('specialization', specialization);
                        setShowSpecializationModal(false);
                      }}
                    >
                      <Text className={`text-base font-semibold ${localFilters.specialization === specialization ? 'text-white' : 'text-text-primary'}`}>{specialization}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>

        {/* Gender Filter */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3 text-text-primary">Gender</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity 
              className={`flex-1 p-3 rounded-lg mr-1 items-center ${!localFilters.gender ? 'bg-primary' : 'bg-background border border-divider'}`}
              onPress={() => handleFilterChange('gender', '')}
            >
              <Text className={`font-semibold ${!localFilters.gender ? 'text-white' : 'text-text-secondary'}`}>All</Text>
            </TouchableOpacity>
            {availableFilters.genderOptions.map((gender) => (
              <TouchableOpacity 
                key={gender}
                className={`flex-1 p-3 rounded-lg mx-1 items-center ${localFilters.gender === gender ? 'bg-primary' : 'bg-background border border-divider'}`}
                onPress={() => handleFilterChange('gender', gender)}
              >
                <Text className={`font-semibold ${localFilters.gender === gender ? 'text-white' : 'text-text-secondary'}`}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Consultation Type Filter */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3 text-text-primary">Consultation Type</Text>
          <View className="flex-row flex-wrap">
            <TouchableOpacity 
              className={`px-4 py-2 rounded-lg m-1 ${!localFilters.consultationType ? 'bg-primary' : 'bg-background border border-divider'}`}
              onPress={() => handleFilterChange('consultationType', '')}
            >
              <Text className={`font-semibold ${!localFilters.consultationType ? 'text-white' : 'text-text-secondary'}`}>All Types</Text>
            </TouchableOpacity>
            {availableFilters.consultationTypes.map((type) => (
              <TouchableOpacity 
                key={type}
                className={`px-4 py-2 rounded-lg m-1 ${localFilters.consultationType === type ? 'bg-primary' : 'bg-background border border-divider'}`}
                onPress={() => handleFilterChange('consultationType', type)}
              >
                <Text className={`font-semibold ${localFilters.consultationType === type ? 'text-white' : 'text-text-secondary'}`}>
                  {type === 'in-person' ? 'In-Person' : 
                   type === 'online' ? 'Online' : 
                   type === 'both' ? 'Both' : type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fee Range Filter */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3 text-text-primary">Consultation Fee Range</Text>
          <TouchableOpacity 
            className="flex-row justify-between items-center border border-gray-300 rounded-lg p-3 bg-gray-50"
            onPress={() => setShowFeeModal(true)}
          >
            <Text className="text-base text-gray-800">
              {localFilters.minFee || localFilters.maxFee ? 
                `₹${localFilters.minFee || 0} - ₹${localFilters.maxFee || 'Any'}` : 
                'Set Fee Range'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          {/* Fee Range Modal */}
          <Modal
            visible={showFeeModal}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCancelFeeRange}
          >
            <View className="flex-1 bg-black/50 justify-center items-center">
              <View className="w-[90%] bg-white rounded-xl p-5 shadow-lg">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-lg font-bold text-text-primary">Set Fee Range</Text>
                  <TouchableOpacity onPress={handleCancelFeeRange}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View className="mb-5">
                  <View className="mb-4">
                    <Text className="text-base mb-2 text-text-primary">Minimum Fee (₹)</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-3 text-base"
                      value={minFee}
                      onChangeText={setMinFee}
                      placeholder="Min"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View className="mb-4">
                    <Text className="text-base mb-2 text-text-primary">Maximum Fee (₹)</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-3 text-base"
                      value={maxFee}
                      onChangeText={setMaxFee}
                      placeholder="Max"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <View className="flex-row justify-between">
                  <TouchableOpacity 
                    className="flex-1 bg-gray-100 p-3 rounded-lg mr-2 items-center"
                    onPress={handleCancelFeeRange}
                  >
                    <Text className="text-gray-600 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-2 bg-blue-500 p-3 rounded-lg items-center flex-1 ml-2"
                    onPress={handleSaveFeeRange}
                  >
                    <Text className="text-white font-semibold">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>

        {/* Rating Filter */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3 text-text-primary">Minimum Rating</Text>
          <TouchableOpacity 
            className="flex-row justify-between items-center border border-gray-300 rounded-lg p-3 bg-gray-50"
            onPress={() => setShowRatingModal(true)}
          >
            <Text className="text-base text-gray-800">
              {localFilters.minRating ? `${localFilters.minRating}+ Stars` : 'Any Rating'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          {/* Rating Modal */}
          <Modal
            visible={showRatingModal}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCancelRating}
          >
            <View className="flex-1 bg-black/50 justify-center items-center">
              <View className="w-[90%] bg-white rounded-xl p-5 shadow-lg">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-lg font-bold text-text-primary">Set Minimum Rating</Text>
                  <TouchableOpacity onPress={handleCancelRating}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View className="mb-5">
                  <Text className="text-base mb-2 text-text-primary">Minimum Rating (1-5)</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 text-base"
                    value={minRating}
                    onChangeText={setMinRating}
                    placeholder="Minimum rating"
                    keyboardType="numeric"
                    maxLength={1}
                  />
                  
                  {/* Star Rating Buttons */}
                  <View className="flex-row justify-between mt-4">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <TouchableOpacity 
                        key={rating}
                        className={`p-2 rounded-full ${parseInt(minRating, 10) === rating ? 'bg-yellow-50' : 'bg-transparent'}`}
                        onPress={() => setMinRating(rating.toString())}
                      >
                        <Ionicons 
                          name={parseInt(minRating, 10) >= rating ? "star" : "star-outline"} 
                          size={32} 
                          color={parseInt(minRating, 10) >= rating ? "#FFD700" : "#666"} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View className="flex-row justify-between">
                  <TouchableOpacity 
                    className="flex-1 bg-gray-100 p-3 rounded-lg mr-2 items-center"
                    onPress={handleCancelRating}
                  >
                    <Text className="text-gray-600 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-2 bg-blue-500 p-3 rounded-lg items-center flex-1 ml-2"
                    onPress={handleSaveRating}
                  >
                    <Text className="text-white font-semibold">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>

        {/* Pin Code Filter */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3 text-text-primary">Pin Code</Text>
          <TouchableOpacity 
            className="flex-row justify-between items-center border border-gray-300 rounded-lg p-3 bg-gray-50"
            onPress={() => setShowPinCodeModal(true)}
          >
            <Text className="text-base text-gray-800">
              {localFilters.pinCode || 'Enter Pin Code'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          {/* Pin Code Modal */}
          <Modal
            visible={showPinCodeModal}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCancelPinCode}
          >
            <View className="flex-1 bg-black/50 justify-center items-center">
              <View className="w-[90%] bg-white rounded-xl p-5 shadow-lg">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-lg font-bold text-text-primary">Enter Pin Code</Text>
                  <TouchableOpacity onPress={handleCancelPinCode}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View className="mb-5">
                  <Text className="text-base mb-2 text-text-primary">Pin Code</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 text-base"
                    value={pinCode}
                    onChangeText={setPinCode}
                    placeholder="Enter pin code"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
                
                <View className="flex-row justify-between">
                  <TouchableOpacity 
                    className="flex-1 bg-gray-100 p-3 rounded-lg mr-2 items-center"
                    onPress={handleCancelPinCode}
                  >
                    <Text className="text-gray-600 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-2 bg-blue-500 p-3 rounded-lg items-center flex-1 ml-2"
                    onPress={handleSavePinCode}
                  >
                    <Text className="text-white font-semibold">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>

      <View className="flex-row justify-between p-4 pt-6 border-t border-divider">
        <TouchableOpacity 
          className="flex-1 bg-background border border-divider p-4 rounded-lg mr-2 items-center justify-center"
          onPress={handleResetFilters}
        >
          <Text className="text-text-secondary font-semibold">Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-2 bg-primary p-4 rounded-lg items-center justify-center flex-1 ml-2"
          onPress={handleApplyFilters}
        >
          <Text className="text-white font-semibold">Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


