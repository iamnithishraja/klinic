import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
}

const ImagePickerModal = ({ 
  visible, 
  onClose, 
  onTakePhoto, 
  onChooseFromGallery 
}: ImagePickerModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="bg-white rounded-t-3xl absolute bottom-0 w-full px-4 py-6">
          <Text className="text-text-primary text-center font-semibold text-lg mb-6">
            Upload Profile Picture
          </Text>
          
          <TouchableOpacity 
            onPress={onTakePhoto}
            className="flex-row items-center p-4 border-b border-divider"
          >
            <MaterialCommunityIcons name="camera" size={24} color="#6366F1" />
            <Text className="text-text-primary ml-4 text-lg">Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={onChooseFromGallery}
            className="flex-row items-center p-4 border-b border-divider"
          >
            <MaterialCommunityIcons name="image" size={24} color="#6366F1" />
            <Text className="text-text-primary ml-4 text-lg">Choose from Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={onClose}
            className="flex-row items-center justify-center mt-4 p-4"
          >
            <Text className="text-red-500 text-lg font-medium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ImagePickerModal; 