import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import type { RatingModalData } from '@/types/ratingTypes';

interface LaboratoryServiceRatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  data: RatingModalData | null;
  isLoading?: boolean;
}

export const LaboratoryServiceRatingModal: React.FC<LaboratoryServiceRatingModalProps> = ({
  visible,
  onClose,
  onSubmit,
  data,
  isLoading = false,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (!data) {
      Alert.alert('Error', 'No rating data available.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || isLoading) return;
    
    if (rating > 0) {
      Alert.alert(
        'Discard Rating?',
        'You have entered a rating. Are you sure you want to close without submitting?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setRating(0);
              setComment('');
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  if (!data) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <ThemedView className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80%]">
          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="items-center mb-6">
              <ThemedText className="text-2xl font-bold text-center mb-2">
                Rate Your Experience
              </ThemedText>
              <ThemedText className="text-gray-600 dark:text-gray-400 text-center">
                Help others by sharing your experience
              </ThemedText>
            </View>

            {/* Service Information */}
            <View className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-3">
                {data.serviceImage && (
                  <Image
                    source={{ uri: data.serviceImage }}
                    className="w-12 h-12 rounded-lg mr-3"
                    resizeMode="cover"
                  />
                )}
                <View className="flex-1">
                  <ThemedText className="text-lg font-semibold">
                    {data.serviceName}
                  </ThemedText>
                  <ThemedText className="text-gray-600 dark:text-gray-400">
                    {data.laboratoryName}
                  </ThemedText>
                </View>
              </View>
              
              {data.serviceDescription && (
                <ThemedText className="text-gray-600 dark:text-gray-400 text-sm">
                  {data.serviceDescription}
                </ThemedText>
              )}
              
              <ThemedText className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                Appointment: {new Date(data.appointmentDate).toLocaleDateString()}
              </ThemedText>
            </View>

            {/* Rating Section */}
            <View className="mb-6">
              <ThemedText className="text-lg font-semibold mb-3 text-center">
                How would you rate this service?
              </ThemedText>
              
              <View className="items-center">
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      className="mx-1"
                      disabled={isSubmitting || isLoading}
                    >
                      <FontAwesome
                        name={rating >= star ? "star" : "star-o"}
                        size={40}
                        color={rating >= star ? "#FFD700" : "#9CA3AF"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {rating > 0 && (
                  <ThemedText className="text-lg font-semibold mt-2 text-center">
                    {rating}/5 stars
                  </ThemedText>
                )}
              </View>
              
              <View className="flex-row justify-between mt-2">
                <ThemedText className="text-xs text-gray-500">Poor</ThemedText>
                <ThemedText className="text-xs text-gray-500">Excellent</ThemedText>
              </View>
            </View>

            {/* Comment Section */}
            <View className="mb-6">
              <ThemedText className="text-lg font-semibold mb-3">
                Share your experience (optional)
              </ThemedText>
              
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Tell us about your experience with this service..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={!isSubmitting && !isLoading}
                className="border border-gray-300 dark:border-gray-600 rounded-xl p-4 text-base dark:text-white bg-white dark:bg-gray-700"
                textAlignVertical="top"
              />
              
              <ThemedText className="text-xs text-gray-500 mt-2 text-right">
                {comment.length}/500
              </ThemedText>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handleClose}
                disabled={isSubmitting || isLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-gray-600 items-center"
              >
                <ThemedText className="font-medium text-gray-700 dark:text-gray-300">
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={rating === 0 || isSubmitting || isLoading}
                className={`flex-1 py-3 px-4 rounded-xl items-center ${
                  rating === 0 || isSubmitting || isLoading
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-blue-500'
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <ThemedText className={`font-medium ${
                    rating === 0 || isSubmitting || isLoading
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-white'
                  }`}>
                    Submit Rating
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}; 