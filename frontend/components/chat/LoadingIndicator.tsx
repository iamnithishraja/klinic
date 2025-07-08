import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export const LoadingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createDotAnimation(dot1, 0);
    const animation2 = createDotAnimation(dot2, 200);
    const animation3 = createDotAnimation(dot3, 400);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View className="mb-6 items-center">
      <View className="flex-row items-start w-[95%] max-w-[600px]">
        {/* Avatar */}
        <View 
          className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-violet-600 shadow-md"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <FontAwesome name="android" size={18} color="#FFFFFF" />
        </View>
        
        {/* Loading Message */}
        <View 
          className="flex-1 bg-white rounded-2xl rounded-tl-2 px-5 py-4 border border-gray-200 shadow-md"
          style={{
            borderTopLeftRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center mb-3">
            <View className="flex-row items-center mr-3">
              <Animated.View
                style={{
                  opacity: dot1,
                  transform: [{ scale: dot1 }],
                }}
                className="w-2 h-2 bg-violet-500 rounded-full mx-0.5"
              />
              <Animated.View
                style={{
                  opacity: dot2,
                  transform: [{ scale: dot2 }],
                }}
                className="w-2 h-2 bg-violet-500 rounded-full mx-0.5"
              />
              <Animated.View
                style={{
                  opacity: dot3,
                  transform: [{ scale: dot3 }],
                }}
                className="w-2 h-2 bg-violet-500 rounded-full mx-0.5"
              />
            </View>
            <Text className="text-gray-600 font-semibold text-base">
              Analyzing your medical context...
            </Text>
          </View>
          
          <View className="mt-2 pt-2 border-t border-gray-100">
            <Text className="text-sm text-gray-500 italic">
              🔍 Reviewing your health profile and symptoms
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}; 