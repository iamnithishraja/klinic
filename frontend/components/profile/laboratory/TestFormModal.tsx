import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TestFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (test: {
    name: string;
    description: string;
  }) => void;
}

const TestFormModal: React.FC<TestFormModalProps> = ({
  visible,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a test name');
      return;
    }
    
    onSubmit({
      name: name.trim(),
      description: description.trim()
    });
    
    // Reset form
    setName('');
    setDescription('');
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8">
            <View className="flex-row justify-between items-center mb-5 pt-1">
              <Text className="text-xl font-bold text-gray-800">Add New Test</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView keyboardShouldPersistTaps="handled">
              {/* Test Name */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">
                  Test Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter test name (e.g., Blood Sugar, CBC)"
                  className="border border-gray-300 rounded-xl p-3 text-gray-800"
                />
              </View>
              
              {/* Description */}
              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2">
                  Test Description (Optional)
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter details about the test (e.g., fasting required, sample type)"
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-xl p-3 text-gray-800"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
              
              {/* Submit Button */}
              <TouchableOpacity 
                className="bg-indigo-500 py-4 rounded-xl items-center"
                onPress={handleSubmit}
              >
                <Text className="text-white font-bold text-base">
                  Add Test
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default TestFormModal; 