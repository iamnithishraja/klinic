import React from 'react';
import { Pressable, Animated, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface VoiceButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isRecording?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onPress,
  disabled = false,
  isRecording = false,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${
          disabled 
            ? 'bg-gray-300' 
            : isRecording 
              ? 'bg-red-500' 
              : Platform.OS === 'web' ? 'bg-blue-500' : 'bg-green-500'
        }`}
        style={({ pressed }) => ({
          shadowColor: disabled ? '#9CA3AF' : isRecording ? '#EF4444' : Platform.OS === 'web' ? '#3B82F6' : '#10B981',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
          opacity: disabled ? 0.6 : (pressed ? 0.8 : 1),
        })}
      >
        <FontAwesome 
          name={isRecording ? "stop" : "microphone"} 
          size={18} 
          color="white" 
        />
      </Pressable>
    </Animated.View>
  );
}; 