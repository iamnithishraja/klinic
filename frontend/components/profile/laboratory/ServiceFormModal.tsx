import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView, FlatList, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons, FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

interface TestInput {
  name: string;
  description: string;
  price: number;
}

interface ServiceFormModalProps {
  visible: boolean;
  onClose: () => void;
  availableCategories?: string[];
  onSubmit: (service: {
    name: string;
    description: string;
    collectionType: 'home' | 'lab' | 'both';
    price: string;
    category?: string;
    tests?: TestInput[];
  }) => void;
}

const ServiceFormModal = forwardRef<{}, ServiceFormModalProps>(({
  visible,
  onClose,
  onSubmit,
  availableCategories = [],
}, ref) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [collectionType, setCollectionType] = useState<'home' | 'lab' | 'both'>('both');
  const [category, setCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Test related state
  const [tests, setTests] = useState<TestInput[]>([]);
  const [currentTestName, setCurrentTestName] = useState('');
  const [currentTestDescription, setCurrentTestDescription] = useState('');
  const [currentTestPrice, setCurrentTestPrice] = useState('');
  
  const handleAddTest = () => {
    if (!currentTestName.trim()) {
      alert('Please enter a test name');
      return;
    }
    
    const priceValue = parseFloat(currentTestPrice);
    if (!currentTestPrice.trim() || isNaN(priceValue) || priceValue <= 0) {
      alert('Please enter a valid test price');
      return;
    }
    
    setTests([
      ...tests, 
      { 
        name: currentTestName.trim(), 
        description: currentTestDescription.trim(),
        price: priceValue
      }
    ]);
    
    // Reset test input fields
    setCurrentTestName('');
    setCurrentTestDescription('');
    setCurrentTestPrice('');
  };
  
  const handleRemoveTest = (index: number) => {
    setTests(tests.filter((_, i) => i !== index));
  };

  const calculateTestsTotal = () => {
    return tests.reduce((sum, test) => sum + test.price, 0);
  };
  
  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a service name');
      return;
    }
    
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      collectionType,
      price,
      category: category.trim(),
      tests: tests.length > 0 ? tests : undefined
    });
    
    // Reset form
    setName('');
    setDescription('');
    setPrice('');
    setCollectionType('both');
    setCategory('');
    setTests([]);
    setCurrentTestName('');
    setCurrentTestDescription('');
    setCurrentTestPrice('');
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-end bg-black/50" style={{ zIndex: 1000 }}>
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[90%]" style={{ zIndex: 1001 }}>
            <View className="flex-row justify-between items-center mb-5 pt-1">
              <Text className="text-xl font-bold text-gray-800">Add New Service</Text>
              <TouchableOpacity 
                onPress={() => {
                  // Clear form if closing without saving
                  setName('');
                  setDescription('');
                  setPrice('');
                  setCollectionType('both');
                  setCategory('');
                  setTests([]);
                  setCurrentTestName('');
                  setCurrentTestDescription('');
                  setCurrentTestPrice('');
                  onClose();
                }}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Service Name */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">
                  Service Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter service name"
                  className="border border-gray-300 rounded-xl p-3 text-gray-800"
                />
              </View>
              
              {/* Category Dropdown - Only show if categories are available */}
              {availableCategories.length > 0 && (
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">
                    Service Category
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="border border-gray-300 rounded-xl p-3"
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className={category ? "text-gray-800" : "text-gray-400"}>
                        {category || "Select a category"}
                      </Text>
                      <MaterialIcons 
                        name={showCategoryDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color="#6B7280" 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {/* Category Dropdown List */}
                  {showCategoryDropdown && (
                    <View className="border border-gray-300 rounded-xl mt-1 max-h-40 overflow-hidden">
                      <ScrollView nestedScrollEnabled={true}>
                        {availableCategories.map((item) => (
                          <TouchableOpacity 
                            key={item}
                            onPress={() => {
                              setCategory(item);
                              setShowCategoryDropdown(false);
                            }}
                            className={`p-3 border-b border-gray-200 ${category === item ? 'bg-indigo-50' : ''}`}
                          >
                            <Text className={`${category === item ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}>
                              {item}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
              
              {/* Description */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">
                  Description
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter service description"
                  multiline
                  numberOfLines={4}
                  className="border border-gray-300 rounded-xl p-3 text-gray-800"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
              
              {/* Price */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">
                  Package Price (₹)
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-xl px-3">
                  <FontAwesome name="rupee" size={16} color="#6B7280" />
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder={tests.length > 0 ? `Auto-calculated: ${calculateTestsTotal()}` : "Enter package price"}
                    keyboardType="number-pad"
                    className="flex-1 p-3 text-gray-800"
                  />
                </View>
                {tests.length > 0 && (
                  <Text className="text-xs text-gray-500 mt-1">
                    Individual tests total: ₹{calculateTestsTotal()}. Leave blank to use auto-calculated price.
                  </Text>
                )}
              </View>
              
              {/* Collection Type */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">
                  Collection Type
                </Text>
                <View className="flex-row justify-between">
                  <TouchableOpacity 
                    className={`flex-1 py-3 mr-2 items-center rounded-xl ${collectionType === 'home' ? 'bg-indigo-500' : 'bg-gray-100'}`}
                    onPress={() => setCollectionType('home')}
                  >
                    <Text className={`font-medium ${collectionType === 'home' ? 'text-white' : 'text-gray-700'}`}>
                      Home
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className={`flex-1 py-3 mx-1 items-center rounded-xl ${collectionType === 'lab' ? 'bg-indigo-500' : 'bg-gray-100'}`}
                    onPress={() => setCollectionType('lab')}
                  >
                    <Text className={`font-medium ${collectionType === 'lab' ? 'text-white' : 'text-gray-700'}`}>
                      Lab
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className={`flex-1 py-3 ml-2 items-center rounded-xl ${collectionType === 'both' ? 'bg-indigo-500' : 'bg-gray-100'}`}
                    onPress={() => setCollectionType('both')}
                  >
                    <Text className={`font-medium ${collectionType === 'both' ? 'text-white' : 'text-gray-700'}`}>
                      Both
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Tests Section */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-700 font-medium">
                    Tests ({tests.length})
                  </Text>
                </View>
                
                {/* Add test form */}
                <View className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                  <Text className="text-gray-700 font-medium mb-1">Test Name</Text>
                  <TextInput
                    value={currentTestName}
                    onChangeText={setCurrentTestName}
                    placeholder="Enter test name (e.g., Blood Sugar, CBC)"
                    className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                  />
                  
                  <Text className="text-gray-700 font-medium mb-1">Test Description</Text>
                  <TextInput
                    value={currentTestDescription}
                    onChangeText={setCurrentTestDescription}
                    placeholder="Enter test description (optional)"
                    multiline
                    numberOfLines={2}
                    className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                    style={{ textAlignVertical: 'top' }}
                  />
                  
                  <Text className="text-gray-700 font-medium mb-1">Test Price (₹) <Text className="text-red-500">*</Text></Text>
                  <View className="flex-row items-center border border-gray-300 rounded-lg px-2 mb-2 bg-white">
                    <FontAwesome name="rupee" size={14} color="#6B7280" />
                    <TextInput
                      value={currentTestPrice}
                      onChangeText={setCurrentTestPrice}
                      placeholder="Enter test price"
                      keyboardType="numeric"
                      className="flex-1 p-2 text-gray-800"
                    />
                  </View>
                  
                  <TouchableOpacity
                    className="bg-indigo-500 py-2 rounded-lg items-center"
                    onPress={handleAddTest}
                  >
                    <Text className="text-white font-medium">Add Test</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Tests list */}
                {tests.length > 0 ? (
                  <View className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
                    {tests.map((test, index) => (
                      <View 
                        key={index} 
                        className={`p-3 ${index < tests.length - 1 ? 'border-b border-gray-200' : ''}`}
                      >
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1 mr-2">
                            <Text className="font-medium text-gray-800">{test.name}</Text>
                            {test.description ? (
                              <Text className="text-gray-600 text-sm mt-1">{test.description}</Text>
                            ) : null}
                            <Text className="text-indigo-600 font-semibold text-sm mt-1">₹{test.price}</Text>
                          </View>
                          <TouchableOpacity
                            className="p-1"
                            onPress={() => handleRemoveTest(index)}
                          >
                            <MaterialIcons name="delete" size={18} color="#F87171" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="bg-gray-50 rounded-lg p-4 items-center justify-center border border-gray-200 mb-4">
                    <Text className="text-gray-500 text-center">
                      No tests added yet. Add tests above.
                    </Text>
                  </View>
                )}
                
                {/* Pricing Summary */}
                {tests.length > 0 && (
                  <View className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
                    <Text className="text-blue-800 font-medium mb-2">Pricing Summary</Text>
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-blue-700">Individual tests total:</Text>
                      <Text className="text-blue-700 font-semibold">₹{calculateTestsTotal()}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-blue-700">Package price:</Text>
                      <Text className="text-blue-700 font-semibold">
                        ₹{price || calculateTestsTotal()}
                      </Text>
                    </View>
                    {!price && (
                      <Text className="text-xs text-blue-600 mt-1">
                        Using auto-calculated price
                      </Text>
                    )}
                  </View>
                )}
              </View>
              
              {/* Submit Button */}
              <TouchableOpacity 
                className="bg-indigo-500 py-4 rounded-xl items-center mb-4"
                onPress={handleSubmit}
              >
                <Text className="text-white font-bold text-base">
                  Add Service
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default ServiceFormModal; 