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
      const url = `/api/v1/ratings/provider/${providerId}/${type}`;
      console.log('RatingDisplay - Fetching rating for provider:', providerId, 'type:', type);
      console.log('RatingDisplay - Full URL:', url);
      console.log('RatingDisplay - API base URL:', apiClient.defaults.baseURL);
      
      const response = await apiClient.get(url);
      console.log('RatingDisplay - API response:', response.data);
      console.log('RatingDisplay - Response status:', response.status);
      
      setRatingData(response.data);
      console.log('RatingDisplay - State updated with:', response.data);
    } catch (error: any) {
      console.error('RatingDisplay - Error fetching rating:', error);
      console.error('RatingDisplay - Error message:', error.message);
      console.error('RatingDisplay - Error response:', error.response?.data);
      console.error('RatingDisplay - Error status:', error.response?.status);
      console.error('RatingDisplay - Error config:', error.config);
      setRatingData({ averageRating: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { textSize: 'text-xs' };
      case 'large':
        return { textSize: 'text-sm' };
      default:
        return { textSize: 'text-xs' };
    }
  };

  const { textSize } = getSizeConfig();

  console.log('RatingDisplay - Render state:', { 
    loading, 
    ratingData, 
    providerId, 
    type,
    hasData: !!ratingData,
    averageRating: ratingData?.averageRating
  });

  const renderStars = () => {
    if (!ratingData || ratingData.averageRating === 0) {
      // Show empty stars when no ratings
      return Array(5).fill(0).map((_, index) => (
        <FontAwesome key={index} name="star-o" size={12} color="#D1D5DB" />
      ));
    }

    const stars = [];
    const fullStars = Math.floor(ratingData.averageRating);
    const hasHalfStar = ratingData.averageRating % 1 >= 0.5;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesome key={`full-${i}`} name="star" size={12} color="#FFD700" />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <FontAwesome key="half" name="star-half-o" size={12} color="#FFD700" />
      );
    }

    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FontAwesome key={`empty-${i}`} name="star-o" size={12} color="#D1D5DB" />
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <View className="flex-row items-center">
        <FontAwesome name="star-o" size={12} color="#D1D5DB" />
        <Text className={`${textSize} text-gray-500 ml-1`}>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center">
      {renderStars()}
      {ratingData && ratingData.averageRating > 0 && (
        <Text className={`${textSize} text-gray-600 ml-1 font-medium`}>
          {ratingData.averageRating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

export default RatingDisplay; 