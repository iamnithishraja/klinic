import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

interface ServiceFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (service: {
    name: string;
    description: string;
    coverImage: string;
    collectionType: 'home' | 'lab' | 'both';
    price: string;
  }) => void;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  visible,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [collectionType, setCollectionType] = useState<'home' | 'lab' | 'both'>('both');
  
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
      price
    });
    
    // Reset form
    setName('');
    setDescription('');
    setPrice('');
    setCoverImage('');
    setCollectionType('both');
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-5 pb-8">
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
            <View className="mb-6">
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
};

export default ServiceFormModal; 