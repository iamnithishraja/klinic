import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Animated, Easing } from 'react-native';

interface SaveButtonProps {
  onPress: () => void;
  loading: boolean;
}

const SaveButton = ({ onPress, loading }: SaveButtonProps) => {
  // Animation for pulsing effect
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const animatedStyle = {
    transform: [{ scale: pulseAnim }],
  };

  return (
    <View 
      className="absolute bottom-24 right-4 left-4"
      style={{ 
        zIndex: 1000,
        elevation: 6,
      }}
    >
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={onPress}
          disabled={loading}
          activeOpacity={0.8}
          className="bg-red-500 rounded-xl py-3.5 items-center shadow-md flex-row justify-center"
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
      </Animated.View>
    </View>
  );
};

export default SaveButton; 