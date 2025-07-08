import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  showRating?: boolean;
  showText?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  size = 'medium',
  showRating = true,
  showText = false,
}) => {
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { starSize: 14, textSize: 'text-xs' };
      case 'large':
        return { starSize: 20, textSize: 'text-base' };
      default:
        return { starSize: 16, textSize: 'text-sm' };
    }
  };

  const { starSize, textSize } = getSizeConfig();

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesome 
          key={`full-${i}`} 
          name="star" 
          size={starSize} 
          color="#FFD700" 
          style={{ marginRight: 2 }} 
        />
      );
    }

    // Half star
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <FontAwesome 
          key="half" 
          name="star-half-o" 
          size={starSize} 
          color="#FFD700" 
          style={{ marginRight: 2 }} 
        />
      );
    }

    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FontAwesome 
          key={`empty-${i}`} 
          name="star-o" 
          size={starSize} 
          color="#9CA3AF" 
          style={{ marginRight: 2 }} 
        />
      );
    }

    return stars;
  };

  const getRatingText = () => {
    if (rating === 0) return 'No ratings yet';
    return `${rating.toFixed(1)}/5`;
  };

  return (
    <View className="flex-row items-center">
      <View className="flex-row">
        {renderStars()}
      </View>
      {showRating && (
        <Text className={`${textSize} text-gray-600 ml-2 font-medium`}>
          {rating > 0 ? rating.toFixed(1) : '0'}
        </Text>
      )}
      {showText && (
        <Text className={`${textSize} text-gray-500 ml-1`}>
          {getRatingText()}
        </Text>
      )}
    </View>
  );
};

export default StarRating; 