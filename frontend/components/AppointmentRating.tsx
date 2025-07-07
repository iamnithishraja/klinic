import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface AppointmentRatingProps {
  rating: number;
  feedback?: string;
}

const AppointmentRating: React.FC<AppointmentRatingProps> = ({ rating, feedback }) => {
  return (
    <View className="flex-row items-center space-x-1 mb-1">
      {[1,2,3,4,5].map((star) => (
        <FontAwesome
          key={star}
          name={rating >= star ? 'star' : 'star-o'}
          size={16}
          color={rating >= star ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
      {feedback && (
        <Text className="ml-2 text-xs text-gray-500 italic">{feedback}</Text>
      )}
    </View>
  );
};

export default AppointmentRating; 