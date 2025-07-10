import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/api/client';

interface RatingDisplayProps {
  providerId: string;
  providerType: 'doctor' | 'lab' | 'laboratoryService';
  size?: 'small' | 'medium' | 'large';
  showBreakdown?: boolean;
}

interface RatingData {
  averageRating: number;
  totalRatings: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  providerId,
  providerType,
  size = 'medium',
  showBreakdown = false,
}) => {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug: Log component props
  console.log('🔍 RatingDisplay props:', { providerId, providerType, size, showBreakdown });

  useEffect(() => {
    if (providerId && providerType) {
      console.log('🚀 RatingDisplay useEffect triggered with:', { providerId, providerType });
      fetchRating();
    } else {
      console.log('⚠️ RatingDisplay useEffect skipped - missing props:', { providerId, providerType });
    }
  }, [providerId, providerType]);

  const fetchRating = async () => {
    try {
      setLoading(true);
      const url = `/api/v1/ratings/providers/${providerId}?type=${providerType}`;
      
      console.log('🔍 Fetching rating for:', { providerId, providerType, url });
      console.log('🔍 Base URL:', apiClient.defaults.baseURL);
      
      // Test API client configuration
      console.log('🔍 API Client config:', {
        baseURL: apiClient.defaults.baseURL,
        headers: apiClient.defaults.headers
      });
      
      // Log the full URL being called
      const fullUrl = `${apiClient.defaults.baseURL}${url}`;
      console.log('🔍 Full URL being called:', fullUrl);
      
      const response = await apiClient.get(url);
      console.log('✅ Rating API response:', response.data);
      console.log('✅ Response status:', response.status);
      console.log('✅ Response headers:', response.headers);
      
      // Add more detailed logging for debugging
      if (response.data.totalRatings === 0) {
        console.log('⚠️ No ratings found for provider:', { providerId, providerType });
        console.log('🔍 This could mean:');
        console.log('   - No ratings exist in the database');
        console.log('   - Ratings exist but with different provider ID');
        console.log('   - Ratings exist but with different provider type');
      } else {
        console.log('✅ Found ratings:', {
          totalRatings: response.data.totalRatings,
          averageRating: response.data.averageRating,
          breakdown: response.data.breakdown
        });
      }
      
      setRatingData(response.data);
      console.log('✅ RatingData state updated:', response.data);
    } catch (error: any) {
      console.error('❌ Rating API error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error object:', error);
      
      // Set default empty rating on error
      setRatingData({ 
        averageRating: 0, 
        totalRatings: 0, 
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } 
      });
    } finally {
      setLoading(false);
      console.log('✅ Loading state set to false');
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

  const renderBreakdown = () => {
    if (!showBreakdown || !ratingData || ratingData.totalRatings === 0) {
      return null;
    }

    return (
      <View className="mt-4">
        <Text className={`${textSize} font-medium text-gray-700 mb-2`}>Rating Breakdown</Text>
        {[5, 4, 3, 2, 1].map((star) => (
          <View key={star} className="flex-row items-center mb-1">
            <Text className={`${textSize} text-gray-600 w-8`}>{star}⭐</Text>
            <View className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
              <View 
                className="bg-yellow-400 h-2 rounded-full"
                style={{ 
                  width: `${(ratingData.breakdown[star as keyof typeof ratingData.breakdown] / ratingData.totalRatings) * 100}%` 
                }}
              />
            </View>
            <Text className={`${textSize} text-gray-600 w-8 text-right`}>
              {ratingData.breakdown[star as keyof typeof ratingData.breakdown]}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    console.log('🔄 RatingDisplay rendering loading state');
    return (
      <View className="flex-row items-center">
        <FontAwesome name="star-o" size={starSize} color="#9CA3AF" />
        <Text className={`${textSize} text-gray-500 ml-1`}>Loading...</Text>
      </View>
    );
  }

  console.log('🎨 RatingDisplay rendering with data:', {
    ratingData,
    averageRating: ratingData?.averageRating,
    totalRatings: ratingData?.totalRatings,
    breakdown: ratingData?.breakdown
  });

  return (
    <View>
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
      {renderBreakdown()}
    </View>
  );
};

export default RatingDisplay; 