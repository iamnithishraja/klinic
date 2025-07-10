import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Text,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import apiClient from '@/api/client';

interface RatingData {
  averageRating: number;
  totalRatings: number;
  breakdown: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

interface LaboratoryServiceRatingDisplayProps {
  serviceId: string;
  serviceName: string;
  showReviews?: boolean;
  maxHeight?: number;
  initialPage?: number;
  pageSize?: number;
}

export const LaboratoryServiceRatingDisplay: React.FC<LaboratoryServiceRatingDisplayProps> = ({
  serviceId,
  serviceName,
  showReviews = true,
  maxHeight = 400,
  initialPage = 1,
  pageSize = 10,
}) => {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [error, setError] = useState<string | null>(null);
  
  const fetchRatings = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching ratings for service:', serviceId, 'page:', page);
      const response = await apiClient.get(`/api/v1/ratings/providers/${serviceId}?type=laboratoryService`);
      
      console.log('📊 Received rating data:', response.data);
      setRatingData(response.data);
      setCurrentPage(page);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch ratings';
      setError(errorMessage);
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRatings(1);
    setRefreshing(false);
  };

  const loadMoreRatings = async () => {
    // Simplified - no pagination in unified API for now
    console.log('Load more not implemented in unified API');
  };

  useEffect(() => {
    if (serviceId && serviceId.trim() !== '') {
      console.log('🔄 Service ID changed, fetching ratings for:', serviceId);
      fetchRatings(initialPage);
    } else {
      console.log('⚠️ No valid service ID provided, skipping fetch');
      setRatingData(null);
      setError('No service ID provided');
    }
  }, [serviceId, initialPage]);

  const getRatingPercentage = (rating: number) => {
    if (!ratingData?.totalRatings) return 0;
    const count = ratingData.breakdown[rating as keyof typeof ratingData.breakdown];
    return Math.round((count / ratingData.totalRatings) * 100);
  };

  const renderRatingBar = (stars: number, count: number) => {
    const percentage = getRatingPercentage(stars);
    return (
      <View className="flex-row items-center mb-2">
        <ThemedText className="text-sm w-8">{stars}★</ThemedText>
        <View className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mx-2">
          <View 
            className="bg-yellow-400 h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </View>
        <ThemedText className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
          {count}
        </ThemedText>
      </View>
    );
  };

  const renderReview = (review: any) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={review.rating >= i ? "star" : "star-o"}
          size={12}
          color={review.rating >= i ? "#FFD700" : "#9CA3AF"}
        />
      );
    }

    return (
      <View key={review._id} className="border-b border-gray-200 dark:border-gray-600 pb-4 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <ThemedText className="font-semibold text-sm">
              {review.userId?.name || 'Anonymous User'}
            </ThemedText>
          </View>
          <View className="flex-row items-center">
            {stars}
            <ThemedText className="text-xs text-gray-500 ml-1">
              {new Date(review.createdAt).toLocaleDateString()}
            </ThemedText>
          </View>
        </View>
        {review.comment && (
          <ThemedText className="text-sm text-gray-600 dark:text-gray-400">
            {review.comment}
          </ThemedText>
        )}
      </View>
    );
  };

  const renderLoadingState = () => (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size="large" color="#3B82F6" />
      <ThemedText className="mt-2 text-gray-600">Loading ratings...</ThemedText>
    </View>
  );

  const renderErrorState = () => (
    <View className="items-center justify-center py-8">
      <FontAwesome name="exclamation-triangle" size={24} color="#EF4444" />
      <ThemedText className="mt-2 text-red-600 text-center">
        {error || 'Failed to load ratings'}
      </ThemedText>
      <TouchableOpacity 
        onPress={() => fetchRatings(1)}
        className="mt-3 bg-blue-500 px-4 py-2 rounded-lg"
      >
        <ThemedText className="text-white font-medium">Retry</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center py-8">
      <FontAwesome name="star-o" size={24} color="#9CA3AF" />
      <ThemedText className="mt-2 text-gray-600">
        {!serviceId || serviceId.trim() === '' 
          ? 'Please select a service to view ratings' 
          : 'No ratings available'
        }
      </ThemedText>
      {serviceId && serviceId.trim() !== '' && (
        <ThemedText className="text-gray-500 text-sm mt-2">Service ID: {serviceId}</ThemedText>
      )}
    </View>
  );



  if (loading && !ratingData) {
    return renderLoadingState();
  }

  if (error && !ratingData) {
    return renderErrorState();
  }

  if (!ratingData) {
    return renderEmptyState();
  }


  
  return (
    <ThemedView className="bg-white dark:bg-gray-800 rounded-xl p-4">
      <ScrollView 
        style={{ maxHeight }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >


        {/* Overall Rating */}
        <View className="items-center mb-6">
          <View className="flex-row items-center mb-2">
            <FontAwesome name="star" size={24} color="#FFD700" />
            <ThemedText className="text-2xl font-bold ml-2">
              {ratingData.averageRating.toFixed(1)}
            </ThemedText>
            <ThemedText className="text-gray-500 ml-1">/5</ThemedText>
          </View>
          <ThemedText className="text-gray-600 dark:text-gray-400">
            Based on {ratingData.totalRatings} reviews
          </ThemedText>
        </View>

        {/* Rating Breakdown */}
        <View className="mb-6">
          <ThemedText className="text-lg font-semibold mb-3">Rating Breakdown</ThemedText>
          {renderRatingBar(5, ratingData.breakdown[5])}
          {renderRatingBar(4, ratingData.breakdown[4])}
          {renderRatingBar(3, ratingData.breakdown[3])}
          {renderRatingBar(2, ratingData.breakdown[2])}
          {renderRatingBar(1, ratingData.breakdown[1])}
        </View>

        {/* Reviews Section */}
        {showReviews && (
          <View>
            <ThemedText className="text-lg font-semibold mb-3">
              Rating Summary
            </ThemedText>
            
            <View className="items-center py-6">
              <FontAwesome name="star" size={24} color="#FFD700" />
              <ThemedText className="mt-2 text-gray-600">
                {ratingData.totalRatings > 0 
                  ? `${ratingData.totalRatings} total ratings` 
                  : 'No ratings yet'
                }
                  </ThemedText>
                <ThemedText className="text-gray-500 text-sm mt-1">
                {ratingData.totalRatings > 0 
                  ? 'Detailed reviews coming soon' 
                  : 'Be the first to rate this service'
                }
                </ThemedText>
              </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}; 