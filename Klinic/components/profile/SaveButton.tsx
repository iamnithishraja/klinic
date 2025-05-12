import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SaveButtonProps {
  onPress: () => void;
  loading: boolean;
}

const SaveButton = ({ onPress, loading }: SaveButtonProps) => {
  return (
    <View 
      className="absolute bottom-24 right-4 left-4"
      style={{ 
        zIndex: 1000,
        elevation: 6,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.8}
        className="bg-primary rounded-xl py-3.5 items-center shadow-md flex-row justify-center"
        style={{ 
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <MaterialIcons name="save-alt" size={20} color="#FFFFFF" />
            <Text className="text-white font-medium text-base ml-2">Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default SaveButton; 