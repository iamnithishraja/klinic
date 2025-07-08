import React, { useEffect, useRef } from 'react';
import { View, Pressable, Animated, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface ToctorFloatingButtonProps {
  onPress: () => void;
}

const ToctorFloatingButton: React.FC<ToctorFloatingButtonProps> = ({ onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create pulsing animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Create glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, [pulseAnim, glowAnim]);

  return (
    <View className="absolute bottom-28 right-6 z-50 w-16 h-16">
      {/* Glow effect */}
      <Animated.View
        className="absolute inset-0 w-16 h-16 rounded-full bg-purple-400"
        style={{
          opacity: glowAnim,
          transform: [{ scale: pulseAnim }],
        }}
      />
      
      {/* Main button */}
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
      >
                  <Pressable
            onPress={onPress}
            style={[
              {
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#7C3AED',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }
            ]}
          >
            {/* Inner glow */}
            <View 
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                right: 4,
                bottom: 4,
                borderRadius: 28,
                backgroundColor: '#A855F7',
                opacity: 0.5,
              }}
            />
            
            {/* Main Icon - Chat/Assistant */}
            <FontAwesome name="comments" size={28} color="#FFFFFF" />
            
            {/* AI Badge */}
            <View 
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#10B981',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#FFFFFF',
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>AI</Text>
            </View>
          </Pressable>
      </Animated.View>
    </View>
  );
};

export default ToctorFloatingButton; 