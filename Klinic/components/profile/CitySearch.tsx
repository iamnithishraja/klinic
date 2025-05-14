import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CitySearchProps {
  allCities: string[];
  selectedCity: string;
  onCitySelect: (city: string) => void;
  isCityChanged?: boolean;
}

const CitySearch = ({ 
  allCities, 
  selectedCity, 
  onCitySelect,
  isCityChanged = false
}: CitySearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>(allCities);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Filter cities based on search term using regex
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCities(allCities);
      return;
    }

    try {
      // Create a case-insensitive regex from the search term
      const regex = new RegExp(searchTerm, 'i');
      const filtered = allCities.filter(city => regex.test(city));
      setFilteredCities(filtered);
    } catch (e) {
      // If regex fails, fall back to simple includes search
      const filtered = allCities.filter(city => 
        city.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [searchTerm, allCities]);

  const handleCityPress = (city: string) => {
    onCitySelect(city);
    setSearchTerm('');
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const dismissKeyboardAndDropdown = () => {
    Keyboard.dismiss();
    setShowDropdown(false);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboardAndDropdown}>
      <View>
        <Text className="text-gray-700 font-medium text-base mb-2">
          City
          {isCityChanged && <Text className="text-red-500 ml-1">*</Text>}
        </Text>
        
        <View className={`border rounded-xl bg-white shadow-sm ${isCityChanged ? 'border-red-400' : 'border-gray-200'}`}>
          {/* Search input */}
          <View className="flex-row items-center px-4 py-3.5">
            <MaterialCommunityIcons 
              name="city" 
              size={22} 
              color={isCityChanged ? "#F87171" : "#6366F1"}
              style={{ marginRight: 12 }} 
            />
            <TextInput 
              ref={inputRef}
              value={selectedCity || searchTerm}
              onChangeText={text => {
                setSearchTerm(text);
                setShowDropdown(true);
                if (!text) {
                  onCitySelect('');
                }
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search for a city..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-800"
            />
            {(selectedCity || searchTerm) && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchTerm('');
                  onCitySelect('');
                  inputRef.current?.focus();
                }}
                className="p-1"
              >
                <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Results dropdown */}
          {showDropdown && filteredCities.length > 0 && (
            <View className="border-t border-gray-200 max-h-40">
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                {filteredCities.slice(0, 10).map((item) => (
                  <TouchableOpacity 
                    key={item}
                    onPress={() => handleCityPress(item)}
                    className="px-4 py-2 border-b border-gray-100"
                  >
                    <Text className="text-gray-800">{item}</Text>
                  </TouchableOpacity>
                ))}
                {filteredCities.length > 10 && (
                  <Text className="text-xs text-center text-gray-500 py-1">
                    {filteredCities.length - 10} more results. Continue typing to refine.
                  </Text>
                )}
              </ScrollView>
            </View>
          )}
          
          {showDropdown && filteredCities.length === 0 && searchTerm && (
            <View className="border-t border-gray-200 p-3">
              <Text className="text-gray-500 text-center">No matching cities found</Text>
            </View>
          )}
        </View>
        
        {selectedCity && (
          <Text className="text-xs text-green-600 mt-1">
            Selected: {selectedCity}
          </Text>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CitySearch; 