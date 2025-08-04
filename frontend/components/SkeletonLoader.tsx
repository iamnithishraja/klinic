import React from 'react';
import { View, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
};

// Predefined skeleton components
export const SkeletonText: React.FC<{ lines?: number; height?: number }> = ({
  lines = 1,
  height = 16,
}) => (
  <View>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        height={height}
        style={{
          marginBottom: index < lines - 1 ? 8 : 0,
          width: index === lines - 1 ? '75%' : '100%',
        }}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC = () => (
  <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <View className="flex-row items-start space-x-4">
      <SkeletonLoader width={48} height={48} borderRadius={8} />
      <View className="flex-1">
        <SkeletonLoader height={20} style={{ marginBottom: 8 }} />
        <SkeletonLoader height={16} style={{ width: '75%' }} />
      </View>
    </View>
  </View>
);

export const SkeletonHero: React.FC = () => (
  <View className="bg-gradient-to-r from-primary to-purple-600 rounded-3xl p-8">
    <SkeletonLoader height={32} style={{ marginBottom: 16 }} />
    <SkeletonLoader height={20} style={{ marginBottom: 8 }} />
    <SkeletonLoader height={20} style={{ width: '75%', marginBottom: 24 }} />
    <View className="flex-row justify-center space-x-4">
      <SkeletonLoader width={120} height={40} borderRadius={8} />
      <SkeletonLoader width={120} height={40} borderRadius={8} />
    </View>
  </View>
);

export const SkeletonStats: React.FC = () => (
  <View className="bg-white rounded-2xl p-6 shadow-sm">
    <View className="flex-row justify-between">
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} className="items-center">
          <SkeletonLoader width={60} height={24} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={80} height={14} />
        </View>
      ))}
    </View>
  </View>
);

export const SkeletonTestimonial: React.FC = () => (
  <View className="bg-white rounded-2xl p-6 shadow-sm">
    <View className="items-center">
      <SkeletonLoader height={20} style={{ marginBottom: 16, width: '80%' }} />
      <SkeletonLoader width={100} height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width={80} height={16} style={{ marginBottom: 8 }} />
      <View className="flex-row space-x-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonLoader key={index} width={16} height={16} borderRadius={8} />
        ))}
      </View>
    </View>
  </View>
);

export default SkeletonLoader; 