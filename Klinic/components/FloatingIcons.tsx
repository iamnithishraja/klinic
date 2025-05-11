import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  interpolate,
  Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface IconConfig {
  name: string;
  color: string;
  size: number;
  startPosition: { x: number; y: number };
  animationDelay: number;
  duration: number;
  floatRange: number;
}

const FloatingIcons = () => {
  const iconConfigs: IconConfig[] = [
    {
      name: 'medical-bag',
      color: '#4F46E5',
      size: 32,
      startPosition: { x: width * 0.1, y: height * 0.2 },
      animationDelay: 0,
      duration: 3000,
      floatRange: 30
    },
    {
      name: 'pill',
      color: '#34D399',
      size: 28,
      startPosition: { x: width * 0.8, y: height * 0.25 },
      animationDelay: 800,
      duration: 3200,
      floatRange: 25
    },
    {
      name: 'heart-pulse',
      color: '#EF4444',
      size: 30,
      startPosition: { x: width * 0.2, y: height * 0.7 },
      animationDelay: 1500,
      duration: 2800,
      floatRange: 35
    },
    {
      name: 'stethoscope',
      color: '#4F46E5',
      size: 34,
      startPosition: { x: width * 0.85, y: height * 0.65 },
      animationDelay: 2000,
      duration: 3400,
      floatRange: 30
    },
    {
      name: 'bandage',
      color: '#FBBF24',
      size: 26,
      startPosition: { x: width * 0.5, y: height * 0.4 },
      animationDelay: 1200,
      duration: 3600,
      floatRange: 40
    },
  ];

  return (
    <View 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 1 
      }} 
      pointerEvents="none"
    >
      {iconConfigs.map((config, index) => (
        <FloatingIcon key={index} config={config} />
      ))}
    </View>
  );
};

const FloatingIcon = ({ config }: { config: IconConfig }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Fade in
    opacity.value = withDelay(
      config.animationDelay,
      withTiming(0.7, { duration: 1000 })
    );
    
    // Continuous floating animation
    translateY.value = withDelay(
      config.animationDelay,
      withRepeat(
        withTiming(-config.floatRange, { 
          duration: config.duration,
          easing: Easing.inOut(Easing.ease)
        }),
        -1, // Infinite repeats
        true // Reverse
      )
    );
    
    // Slow rotation
    rotate.value = withDelay(
      config.animationDelay,
      withRepeat(
        withTiming(360, { 
          duration: config.duration * 2,
          easing: Easing.linear
        }),
        -1, // Infinite repeats
        false // Don't reverse
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { rotate: `${interpolate(rotate.value, [0, 360], [0, 360])}deg` }
      ],
      opacity: opacity.value,
      position: 'absolute',
      left: config.startPosition.x,
      top: config.startPosition.y,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <MaterialCommunityIcons 
        name={config.name} 
        size={config.size} 
        color={config.color} 
      />
    </Animated.View>
  );
};

export default FloatingIcons; 