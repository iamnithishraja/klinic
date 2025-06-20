import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LaboratoryTest } from '../../../types/laboratoryTypes';

interface TestItemProps {
  test: LaboratoryTest;
  onUpdate: (updates: Partial<Omit<LaboratoryTest, 'id'>>) => void;
  onDelete: () => void;
}

const TestItem: React.FC<TestItemProps> = ({ test, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(test.name);
  const [description, setDescription] = useState(test.description);
  const [price, setPrice] = useState(test.price?.toString() || '');

  const handleSaveChanges = () => {
    const priceValue = parseFloat(price);
    if (!price.trim() || isNaN(priceValue) || priceValue <= 0) {
      alert('Please enter a valid price');
      return;
    }
    onUpdate({ name, description, price: priceValue });
    setIsEditing(false);
  };

  return (
    <View className="bg-gray-50 rounded-lg p-3 mb-2">
      {!isEditing ? (
        <>
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-medium text-gray-800">{test.name}</Text>
              {test.description ? (
                <Text className="text-gray-600 text-sm mt-1">{test.description}</Text>
              ) : null}
              <Text className="text-indigo-600 font-semibold text-sm mt-1">₹{test.price}</Text>
            </View>
            
            <View className="flex-row">
              <TouchableOpacity 
                className="mr-2"
                onPress={() => setIsEditing(true)}
              >
                <MaterialIcons name="edit" size={18} color="#6366F1" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={onDelete}>
                <MaterialIcons name="close" size={18} color="#F87171" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Edit Mode */}
          <View className="mb-2">
            <Text className="text-xs text-gray-500 mb-1">Test Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="border border-gray-300 rounded-md p-2 text-gray-800 text-sm"
            />
          </View>
          
          <View className="mb-2">
            <Text className="text-xs text-gray-500 mb-1">Description (Optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              className="border border-gray-300 rounded-md p-2 text-gray-800 text-sm"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
          
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Price (₹)</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="Enter price"
              className="border border-gray-300 rounded-md p-2 text-gray-800 text-sm"
            />
          </View>
          
          <View className="flex-row justify-end">
            <TouchableOpacity 
              className="mr-2 py-1 px-3 rounded-md bg-gray-200"
              onPress={() => {
                setName(test.name);
                setDescription(test.description);
                setPrice(test.price?.toString() || '');
                setIsEditing(false);
              }}
            >
              <Text className="text-gray-700 text-xs">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="py-1 px-3 rounded-md bg-indigo-500"
              onPress={handleSaveChanges}
            >
              <Text className="text-white text-xs">Save</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default TestItem; 