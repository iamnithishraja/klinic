import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLaboratoryStore } from '../../store/laboratoryStore';
import type { LaboratorySearchFilters } from '../../services/laboratoryService';

interface LaboratoryFiltersProps {
  onApplyFilters: () => void;
  onClose: () => void;
}

export default function LaboratoryFilters({ onApplyFilters, onClose }: LaboratoryFiltersProps) {
  const { filters, availableFilters, setFilters, resetFilters, searchLaboratories } = useLaboratoryStore();
  
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<LaboratorySearchFilters>({ ...filters });
  
  // Modal states
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPinCodeModal, setShowPinCodeModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Price range state
  const [minPrice, setMinPrice] = useState(localFilters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(localFilters.maxPrice?.toString() || '');
  
  // Rating state
  const [minRating, setMinRating] = useState(localFilters.minRating?.toString() || '');
  
  // Pin code state
  const [pinCode, setPinCode] = useState(localFilters.pinCode || '');

  // Reset local filters when global filters change
  useEffect(() => {
    setLocalFilters({ ...filters });
    setMinPrice(filters.minPrice?.toString() || '');
    setMaxPrice(filters.maxPrice?.toString() || '');
    setMinRating(filters.minRating?.toString() || '');
    setPinCode(filters.pinCode || '');
  }, [filters]);

  const handleFilterChange = (key: keyof LaboratorySearchFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePriceRange = () => {
    const min = minPrice ? parseInt(minPrice, 10) : undefined;
    const max = maxPrice ? parseInt(maxPrice, 10) : undefined;
    
    setLocalFilters(prev => ({
      ...prev,
      minPrice: min,
      maxPrice: max
    }));
    
    setShowPriceModal(false);
  };
  
  const handleCancelPriceRange = () => {
    setMinPrice(localFilters.minPrice?.toString() || '');
    setMaxPrice(localFilters.maxPrice?.toString() || '');
    setShowPriceModal(false);
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
    searchLaboratories({page: 1});
    onClose();
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="pt-12 pb-4 px-4 flex-row justify-between items-center border-b border-divider">
        <Text className="text-xl font-bold text-text-primary">Filter Laboratories</Text>
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

        {/* Category Filter */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3 text-text-primary">Test Category</Text>
          <TouchableOpacity 
            className="flex-row justify-between items-center border border-divider rounded-lg p-4 bg-background"
            onPress={() => setShowCategoryModal(true)}
          >
            <Text className="text-base text-text-primary">
              {localFilters.category || 'All Categories'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          
          {/* Category Dropdown Modal */}
          <Modal
            visible={showCategoryModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View className="flex-1 bg-black/60 justify-center items-center">
              <View className="w-[90%] bg-surface rounded-xl p-5 shadow-lg max-h-[70%]">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-lg font-bold text-text-primary">Select Category</Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView className="max-h-[400px]">
                  <TouchableOpacity 
                    className={`p-4 rounded-lg mb-2 ${!localFilters.category ? 'bg-primary' : 'bg-background border border-divider'}`}
                    onPress={() => {
                      handleFilterChange('category', '');
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text className={`text-base font-semibold ${!localFilters.category ? 'text-white' : 'text-text-primary'}`}>All Categories</Text>
                  </TouchableOpacity>
                  
                  {availableFilters.categories.map((category) => (
                    <TouchableOpacity 
                      key={category}
                      className={`p-4 rounded-lg mb-2 ${localFilters.category === category ? 'bg-primary' : 'bg-background border border-divider'}`}
                      onPress={() => {
                        handleFilterChange('category', category);
                        setShowCategoryModal(false);
                      }}
                    >
                      <Text className={`text-base font-semibold ${localFilters.category === category ? 'text-white' : 'text-text-primary'}`}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>

        {/* Collection Type Filter */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3 text-text-primary">Collection Type</Text>
          <View className="flex-row flex-wrap">
            <TouchableOpacity 
              className={`px-4 py-2 rounded-lg m-1 ${!localFilters.collectionType ? 'bg-primary' : 'bg-background border border-divider'}`}
              onPress={() => handleFilterChange('collectionType', '')}
            >
              <Text className={`font-semibold ${!localFilters.collectionType ? 'text-white' : 'text-text-secondary'}`}>All Types</Text>
            </TouchableOpacity>
            {availableFilters.collectionTypes.map((type) => (
              <TouchableOpacity 
                key={type}
                className={`px-4 py-2 rounded-lg m-1 ${localFilters.collectionType === type ? 'bg-primary' : 'bg-background border border-divider'}`}
                onPress={() => handleFilterChange('collectionType', type)}
              >
                <Text className={`font-semibold ${localFilters.collectionType === type ? 'text-white' : 'text-text-secondary'}`}>
                  {type === 'home' ? 'Home' : 
                   type === 'lab' ? 'Lab' : 
                   type === 'both' ? 'Both' : type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range Filter */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3 text-text-primary">Price Range</Text>
          <TouchableOpacity 
            className="flex-row justify-between items-center border border-divider rounded-lg p-4 bg-background"
            onPress={() => setShowPriceModal(true)}
          >
            <Text className="text-base text-text-primary">
              {localFilters.minPrice || localFilters.maxPrice ? 
                `₹${localFilters.minPrice || 0} - ₹${localFilters.maxPrice || 'Any'}` : 
                'Set Price Range'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          {/* Price Range Modal */}
          <Modal
            visible={showPriceModal}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCancelPriceRange}
          >
            <View className="flex-1 bg-black/50 justify-center items-center">
              <View className="w-[90%] bg-surface rounded-xl p-5 shadow-lg">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-lg font-bold text-text-primary">Set Price Range</Text>
                  <TouchableOpacity onPress={handleCancelPriceRange}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View className="mb-5">
                  <View className="mb-4">
                    <Text className="text-base mb-2 text-text-primary">Minimum Price (₹)</Text>
                    <TextInput
                      className="border border-divider rounded-lg p-3 text-base bg-background"
                      value={minPrice}
                      onChangeText={setMinPrice}
                      placeholder="Min"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View className="mb-4">
                    <Text className="text-base mb-2 text-text-primary">Maximum Price (₹)</Text>
                    <TextInput
                      className="border border-divider rounded-lg p-3 text-base bg-background"
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                      placeholder="Max"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <View className="flex-row justify-between">
                  <TouchableOpacity 
                    className="flex-1 bg-background border border-divider p-3 rounded-lg mr-2 items-center"
                    onPress={handleCancelPriceRange}
                  >
                    <Text className="text-text-secondary font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-2 bg-primary p-3 rounded-lg items-center flex-1 ml-2"
                    onPress={handleSavePriceRange}
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
            className="flex-row justify-between items-center border border-divider rounded-lg p-4 bg-background"
            onPress={() => setShowRatingModal(true)}
          >
            <Text className="text-base text-text-primary">
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
              <View className="w-[90%] bg-surface rounded-xl p-5 shadow-lg">
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
                        className={`p-2 rounded-full ${parseInt(minRating, 10) === rating ? 'bg-yellow-100' : 'bg-transparent'}`}
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
                    className="flex-1 bg-background border border-divider p-3 rounded-lg mr-2 items-center"
                    onPress={handleCancelRating}
                  >
                    <Text className="text-text-secondary font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-2 bg-primary p-3 rounded-lg items-center flex-1 ml-2"
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
            className="flex-row justify-between items-center border border-divider rounded-lg p-4 bg-background"
            onPress={() => setShowPinCodeModal(true)}
          >
            <Text className="text-base text-text-primary">
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
              <View className="w-[90%] bg-surface rounded-xl p-5 shadow-lg">
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
                    className="flex-1 bg-background border border-divider p-3 rounded-lg mr-2 items-center"
                    onPress={handleCancelPinCode}
                  >
                    <Text className="text-text-secondary font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-2 bg-primary p-3 rounded-lg items-center flex-1 ml-2"
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


