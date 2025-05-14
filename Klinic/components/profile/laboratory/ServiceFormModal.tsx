import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView, FlatList, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons, FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

interface TestInput {
  name: string;
  description: string;
}

interface ServiceFormModalProps {
  visible: boolean;
  onClose: () => void;
  availableCategories?: string[];
  uploadingCoverImage?: boolean;
  onSubmit: (service: {
    name: string;
    description: string;
    coverImage: string;
    collectionType: 'home' | 'lab' | 'both';
    price: string;
    category?: string;
    tests?: TestInput[];
  }) => void;
  onChangeCoverImage?: () => void;
}

// Export the ref handle type for external use
export interface ServiceFormModalHandle {
  setServiceCoverImage: (imageUrl: string) => void;
}

const ServiceFormModal = forwardRef<ServiceFormModalHandle, ServiceFormModalProps>(({
  visible,
  onClose,
  onSubmit,
  availableCategories = [],
  uploadingCoverImage = false,
  onChangeCoverImage
}, ref) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [collectionType, setCollectionType] = useState<'home' | 'lab' | 'both'>('both');
  const [category, setCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Test related state
  const [tests, setTests] = useState<TestInput[]>([]);
  const [currentTestName, setCurrentTestName] = useState('');
  const [currentTestDescription, setCurrentTestDescription] = useState('');
  
  // Expose methods to parent components via the ref
  useImperativeHandle(ref, () => ({
    setServiceCoverImage: (imageUrl: string) => {
      setCoverImage(imageUrl);
    }
  }));
  
  // Listen for changes to the coverImage from the parent component
  useEffect(() => {
    // If the uploading flag changes from true to false, we need to check if
    // the parent component has updated the coverImage
    if (!uploadingCoverImage) {
      // We could update the coverImage here when the API returns a URL
      // For now, we'll rely on the parent component to handle this
    }
  }, [uploadingCoverImage]);
  
  // Handle the cover image click
  const handleCoverImageClick = () => {
    if (onChangeCoverImage) {
      onChangeCoverImage();
    }
  };
  
  const handleAddTest = () => {
    if (!currentTestName.trim()) {
      alert('Please enter a test name');
      return;
    }
    
    setTests([
      ...tests, 
      { name: currentTestName.trim(), description: currentTestDescription.trim() }
    ]);
    
    // Reset test input fields
    setCurrentTestName('');
    setCurrentTestDescription('');
  };
  
  const handleRemoveTest = (index: number) => {
    setTests(tests.filter((_, i) => i !== index));
  };
  
  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a service name');
      return;
    }
    
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      coverImage,
      collectionType,
      price,
      category: category.trim(),
      tests: tests.length > 0 ? tests : undefined
    });
    
    // Reset form
    setName('');
    setDescription('');
    setPrice('');
    setCoverImage('');
    setCollectionType('both');
    setCategory('');
    setTests([]);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[90%]">
          <View className="flex-row justify-between items-center mb-5 pt-1">
            <Text className="text-xl font-bold text-gray-800">Add New Service</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
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
            
            {/* Cover Image */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">
                Cover Image
              </Text>
              <TouchableOpacity
                onPress={handleCoverImageClick}
                disabled={uploadingCoverImage}
                className="flex items-center justify-center border-2 border-dashed rounded-xl bg-white border-gray-300"
                style={{ height: 150 }}
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
                    <Text className="text-gray-500 mt-2">Upload service image</Text>
                    <Text className="text-gray-400 text-xs mt-1">Tap to select an image</Text>
                  </View>
                )}
              </TouchableOpacity>
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
                Price (₹)
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-3">
                <FontAwesome name="rupee" size={16} color="#6B7280" />
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Enter price"
                  keyboardType="number-pad"
                  className="flex-1 p-3 text-gray-800"
                />
              </View>
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
                <TextInput
                  value={currentTestName}
                  onChangeText={setCurrentTestName}
                  placeholder="Test name"
                  className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                />
                
                <TextInput
                  value={currentTestDescription}
                  onChangeText={setCurrentTestDescription}
                  placeholder="Test description (optional)"
                  multiline
                  numberOfLines={2}
                  className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                  style={{ textAlignVertical: 'top' }}
                />
                
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
    </Modal>
  );
});

export default ServiceFormModal; 