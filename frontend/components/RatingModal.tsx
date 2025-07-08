import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput,  Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useCustomAlert } from './CustomAlert';
import apiClient from '@/api/client';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  appointmentId: string;
  providerId: string;
  providerName: string;
  type: 'doctor' | 'laboratory';
  onRatingSubmitted: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  appointmentId,
  providerId,
  providerName,
  type,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showAlert, AlertComponent } = useCustomAlert();

  // Debug: Log the props
  console.log('RatingModal - profileId:', providerId);
  console.log('RatingModal - type:', type);
  console.log('RatingModal - appointmentId:', appointmentId);

  const handleStarPress = (starNumber: number) => {
    setRating(starNumber);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showAlert({
        title: 'Rating Required',
        message: 'Please select a rating before submitting.',
        type: 'warning'
      });
      return;
    }

    setSubmitting(true);
    try {
      const ratingData = {
        appointmentId,
        profileId: providerId,
        type,
        rating,
        feedback: feedback.trim() || undefined,
        mark: true // Always set mark true on submit
      };
      
      console.log('📤 Submitting rating:', ratingData);
      const response = await apiClient.post('/api/v1/ratings', ratingData);
      console.log('✅ Rating submitted successfully:', response.data);
      
      showAlert({
        title: 'Thank You!',
        message: 'Your rating has been submitted successfully.',
        type: 'success'
      });
      
      setRating(0);
      setFeedback('');
      onClose();
      onRatingSubmitted();
    } catch (error: any) {
      console.error('❌ Rating submission failed:', error.response?.data || error.message);
      showAlert({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to submit rating. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (rating > 0) {
      Alert.alert(
        'Discard Rating?',
        'You have selected a rating. Are you sure you want to close without submitting?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setRating(0);
              setFeedback('');
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  const renderStars = () => {
    return (
      <View className="flex-row justify-center space-x-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => handleStarPress(star)}
            className="p-2"
          >
            <FontAwesome
              name={rating >= star ? 'star' : 'star-o'}
              size={32}
              color={rating >= star ? '#FFD700' : '#D1D5DB'}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  const getRatingText = () => {
    if (rating === 0) return 'Tap to rate';
    if (rating === 1) return 'Poor';
    if (rating === 2) return 'Fair';
    if (rating === 3) return 'Good';
    if (rating === 4) return 'Very Good';
    if (rating === 5) return 'Excellent';
    return '';
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Rate Your Experience</Text>
              <Pressable onPress={handleClose} className="p-2">
                <FontAwesome name="times" size={20} color="#6B7280" />
              </Pressable>
            </View>

            {/* Provider Info */}
            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-1">
                {type === 'doctor' ? `Dr. ${providerName}` : providerName}
              </Text>
              <Text className="text-gray-600 text-sm">
                {type === 'doctor' ? 'Doctor Consultation' : 'Laboratory Service'}
              </Text>
            </View>

            {/* Stars */}
            {renderStars()}

            {/* Rating Text */}
            <Text className="text-center text-lg font-medium text-gray-900 mb-6">
              {getRatingText()}
            </Text>

            {/* Feedback Input */}
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">Share your experience (optional)</Text>
              <TextInput
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Tell us about your experience..."
                multiline
                numberOfLines={4}
                maxLength={500}
                className="border border-gray-300 rounded-xl p-4 text-gray-900 bg-white"
                textAlignVertical="top"
              />
              <Text className="text-gray-500 text-xs mt-1 text-right">
                {feedback.length}/500
              </Text>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting || rating === 0}
              className={`py-4 px-6 rounded-xl flex-row items-center justify-center ${
                submitting || rating === 0 ? 'bg-gray-300' : 'bg-blue-500'
              }`}
            >
              {submitting ? (
                <FontAwesome name="spinner" size={16} color="#6B7280" />
              ) : (
                <FontAwesome name="check" size={16} color="white" style={{ marginRight: 8 }} />
              )}
              <Text className={`font-medium ${submitting || rating === 0 ? 'text-gray-500' : 'text-white'}`}>
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <AlertComponent />
    </>
  );
};

export default RatingModal; 