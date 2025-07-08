import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/api/client';

interface RatingDisplayProps {
  providerId: string;
  type: 'doctor' | 'laboratory';
  size?: 'small' | 'medium' | 'large';
}

interface RatingData {
  averageRating: number;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  providerId,
  type,
  size = 'medium',
}) => {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (providerId && type) {
      fetchRating();
    }
  }, [providerId, type]);

  const fetchRating = async () => {
    try {
      setLoading(true);
      // Use the new API endpoint that expects profile ID
      const url = `/api/v1/ratings/profile/${providerId}/${type}`;
      
      console.log('🔍 Fetching rating for:', { providerId, type, url });
      const response = await apiClient.get(url);
      console.log('✅ Rating API response:', response.data);
      setRatingData(response.data);
    } catch (error: any) {
      console.error('❌ Rating API error:', error.response?.data || error.message);
      // Set default empty rating on error
      setRatingData({ averageRating: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { starSize: 14, textSize: 'text-xs' };
      case 'large':
        return { starSize: 18, textSize: 'text-base' };
      default:
        return { starSize: 16, textSize: 'text-sm' };
    }
  };

  const { starSize, textSize } = getSizeConfig();

  const renderStars = () => {
    // Only show real rating data, no defaults
    const rating = ratingData?.averageRating || 0;
    
    if (rating === 0) {
      // Show empty stars when no ratings exist
      return Array(5).fill(0).map((_, index) => (
        <FontAwesome 
          key={index} 
          name="star-o" 
          size={starSize} 
          color="#9CA3AF" 
          style={{ marginRight: 1 }}
        />
      ));
    }

    const stars = [];
    const fullStars = Math.floor(ratingData!.averageRating);
    const hasHalfStar = ratingData!.averageRating % 1 >= 0.5;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesome 
          key={`full-${i}`} 
          name="star" 
          size={starSize} 
          color="#FFD700" 
          style={{ marginRight: 1 }}
        />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <FontAwesome 
          key="half" 
          name="star-half-o" 
          size={starSize} 
          color="#FFD700" 
          style={{ marginRight: 1 }}
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
          style={{ marginRight: 1 }}
        />
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <View className="flex-row items-center">
        <FontAwesome name="star-o" size={starSize} color="#9CA3AF" />
        <Text className={`${textSize} text-gray-500 ml-1`}>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center">
      {renderStars()}
      {ratingData && ratingData.averageRating > 0 ? (
        <Text className={`${textSize} text-gray-600 ml-1 font-medium`}>
          {ratingData.averageRating.toFixed(1)}
        </Text>
      ) : (
        <Text className={`${textSize} text-gray-500 ml-1`}>
          No ratings
        </Text>
      )}
    </View>
  );
};

export default RatingDisplay; 