import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { LaboratoryService, LaboratoryTest } from '../../../types/laboratoryTypes';
import TestItem from './TestItem';
import TestFormModal from './TestFormModal';

interface ServiceCardProps {
  service: LaboratoryService;
  onUpdate: (updates: Partial<Omit<LaboratoryService, 'id' | 'tests'>>) => void;
  onDelete: () => void;
  onAddTest: (test: Omit<LaboratoryTest, 'id'>) => void;
  onUpdateTest: (testId: string, updates: Partial<Omit<LaboratoryTest, 'id'>>) => void;
  onDeleteTest: (testId: string) => void;
  onUploadCoverImage: (serviceId: string) => void;
  availableCategories?: string[];
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onUpdate,
  onDelete,
  onAddTest,
  onUpdateTest,
  onDeleteTest,
  onUploadCoverImage,
  availableCategories = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // Local state for editing
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description);
  const [price, setPrice] = useState(service.price);
  const [collectionType, setCollectionType] = useState(service.collectionType);
  const [category, setCategory] = useState(service.category || '');
  
  // Collection type options
  const collectionOptions = [
    { value: 'home', label: 'Home Collection' },
    { value: 'lab', label: 'Lab Visit' },
    { value: 'both', label: 'Both' }
  ];
  
  const handleSaveChanges = () => {
    onUpdate({
      name,
      description,
      price,
      collectionType: collectionType as 'home' | 'lab' | 'both',
      category
    });
    setIsEditing(false);
  };
  
  const handleAddTest = (test: Omit<LaboratoryTest, 'id'>) => {
    onAddTest(test);
    setShowTestModal(false);
  };
  
  // Convert collection type to display text
  const getCollectionTypeDisplay = (type: string) => {
    switch (type) {
      case 'home': return 'Home Collection';
      case 'lab': return 'Lab Visit';
      case 'both': return 'Home & Lab';
      default: return 'Not Specified';
    }
  };
  
  return (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm">
      {/* Service Card Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center flex-1">
          <Text className="font-bold text-base text-gray-800">
            {service.name}
          </Text>
        </View>
        
        <View className="flex-row">
          <TouchableOpacity 
            className="mr-3"
            onPress={() => setShowActionMenu(!showActionMenu)}
          >
            <MaterialIcons name="more-vert" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Action Menu */}
      {showActionMenu && (
        <View className="absolute top-12 right-4 bg-white rounded-lg border border-gray-200 shadow-lg z-10">
          <TouchableOpacity 
            className="flex-row items-center p-3 border-b border-gray-100"
            onPress={() => {
              setIsEditing(true);
              setShowActionMenu(false);
            }}
          >
            <MaterialIcons name="edit" size={18} color="#6366F1" />
            <Text className="ml-2 text-gray-700">Edit Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center p-3 border-b border-gray-100"
            onPress={() => {
              onUploadCoverImage(service.id);
              setShowActionMenu(false);
            }}
          >
            <MaterialIcons name="add-photo-alternate" size={18} color="#6366F1" />
            <Text className="ml-2 text-gray-700">
              {service.coverImage ? 'Change Cover Image' : 'Add Cover Image'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center p-3"
            onPress={() => {
              onDelete();
              setShowActionMenu(false);
            }}
          >
            <MaterialIcons name="delete" size={18} color="#F87171" />
            <Text className="ml-2 text-gray-700">Delete Service</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Service Details */}
      {!isEditing ? (
        <View>
          {/* Service Category */}
          {service.category && (
            <View className="mb-3 flex-row items-center">
              <MaterialIcons name="category" size={16} color="#6366F1" />
              <Text className="text-indigo-600 font-medium text-sm ml-1 px-2 py-1 bg-indigo-50 rounded-md">
                {service.category}
              </Text>
            </View>
          )}
          
          {/* Service Description */}
          <View className="mb-3">
            <Text className="text-sm text-gray-500 mb-1">Description</Text>
            <Text className="text-gray-700">{service.description || 'No description provided.'}</Text>
          </View>
          
          {/* Service Image */}
          {service.coverImage ? (
            <View className="mb-3">
              <Image 
                source={{ uri: service.coverImage }} 
                className="w-full h-40 rounded-lg" 
              />
            </View>
          ) : (
            <TouchableOpacity 
              className="mb-3 border-2 border-dashed border-gray-300 rounded-lg p-3 items-center justify-center bg-gray-50 h-24"
              onPress={() => {
                onUploadCoverImage(service.id);
              }}
            >
              <MaterialIcons name="add-photo-alternate" size={24} color="#6B7280" />
              <Text className="text-gray-500 mt-2">Add cover image</Text>
            </TouchableOpacity>
          )}
          
          {/* Price and Collection Type */}
          <View className="flex-row mb-3">
            <View className="flex-1 flex-row items-center">
              <FontAwesome name="rupee" size={16} color="#6366F1" />
              <Text className="text-gray-800 text-base font-medium ml-2">
                {service.price ? `₹${service.price}` : 'Price not set'}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <MaterialCommunityIcons 
                name={service.collectionType === 'home' ? 'home' : 'flask'} 
                size={18} 
                color="#6366F1" 
              />
              <Text className="text-gray-700 ml-2">
                {getCollectionTypeDisplay(service.collectionType)}
              </Text>
            </View>
          </View>
          
          {/* Tests Section */}
          <View className="mt-4 pt-4 border-t border-gray-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-medium text-gray-800">
                Tests ({service.tests.length})
              </Text>
              
              <TouchableOpacity 
                className="bg-indigo-100 py-1 px-3 rounded-lg flex-row items-center"
                onPress={() => setShowTestModal(true)}
              >
                <Ionicons name="add" size={16} color="#6366F1" />
                <Text className="text-indigo-600 font-medium ml-1">Add Test</Text>
              </TouchableOpacity>
            </View>
            
            {service.tests.length === 0 ? (
              <Text className="text-gray-500 text-center py-3">
                No tests added yet.
              </Text>
            ) : (
              service.tests.map((test: LaboratoryTest) => (
                <TestItem 
                  key={test.id}
                  test={test}
                  onUpdate={(updates: Partial<Omit<LaboratoryTest, 'id'>>) => onUpdateTest(test.id, updates)}
                  onDelete={() => onDeleteTest(test.id)}
                />
              ))
            )}
          </View>
        </View>
      ) : (
        // Edit Mode
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            {/* Name */}
            <View className="mb-3">
              <Text className="text-sm text-gray-600 mb-1">Service Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                className="border border-gray-300 rounded-lg p-2 text-gray-800"
              />
            </View>
            
            {/* Category dropdown - only show if categories are available */}
            {availableCategories.length > 0 && (
              <View className="mb-3">
                <Text className="text-sm text-gray-600 mb-1">Category</Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="border border-gray-300 rounded-lg p-2"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className={category ? "text-gray-800" : "text-gray-400"}>
                      {category || "Select a category"}
                    </Text>
                    <MaterialIcons 
                      name={showCategoryDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={22} 
                      color="#6B7280" 
                    />
                  </View>
                </TouchableOpacity>
                
                {/* Category Dropdown List */}
                {showCategoryDropdown && (
                  <View className="border border-gray-300 rounded-lg mt-1 max-h-40 overflow-hidden">
                    <ScrollView nestedScrollEnabled={true}>
                      <TouchableOpacity 
                        onPress={() => {
                          setCategory('');
                          setShowCategoryDropdown(false);
                        }}
                        className="p-2 border-b border-gray-200"
                      >
                        <Text className="text-gray-400">None</Text>
                      </TouchableOpacity>
                      {availableCategories.map((item) => (
                        <TouchableOpacity 
                          key={item}
                          onPress={() => {
                            setCategory(item);
                            setShowCategoryDropdown(false);
                          }}
                          className={`p-2 border-b border-gray-200 ${category === item ? 'bg-indigo-50' : ''}`}
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
            <View className="mb-3">
              <Text className="text-sm text-gray-600 mb-1">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="border border-gray-300 rounded-lg p-2 text-gray-800"
                style={{ textAlignVertical: 'top' }}
              />
            </View>
            
            {/* Price */}
            <View className="mb-3">
              <Text className="text-sm text-gray-600 mb-1">Price (₹)</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="number-pad"
                className="border border-gray-300 rounded-lg p-2 text-gray-800"
              />
            </View>
            
            {/* Collection Type */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">Collection Type</Text>
              <View className="flex-row">
                {collectionOptions.map((option) => (
                  <TouchableOpacity 
                    key={option.value}
                    className={`mr-3 py-2 px-3 rounded-lg ${collectionType === option.value ? 'bg-indigo-500' : 'bg-gray-200'}`}
                    onPress={() => setCollectionType(option.value as 'home' | 'lab' | 'both')}
                  >
                    <Text className={collectionType === option.value ? 'text-white' : 'text-gray-700'}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Action Buttons */}
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity 
                className="mr-3 py-2 px-4 rounded-lg bg-gray-200"
                onPress={() => {
                  setName(service.name);
                  setDescription(service.description);
                  setPrice(service.price);
                  setCollectionType(service.collectionType);
                  setCategory(service.category || '');
                  setIsEditing(false);
                }}
              >
                <Text className="text-gray-700">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="py-2 px-4 rounded-lg bg-indigo-500"
                onPress={handleSaveChanges}
              >
                <Text className="text-white font-medium">Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      
      {/* Test Form Modal */}
      <TestFormModal 
        visible={showTestModal}
        onClose={() => setShowTestModal(false)}
        onSubmit={handleAddTest}
      />
    </View>
  );
};

export default ServiceCard; 