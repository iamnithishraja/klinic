import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface RatingPopupProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
  providerName: string;
}

const RatingPopup: React.FC<RatingPopupProps> = ({ visible, onClose, onSubmit, providerName }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md items-center">
          <Text className="text-xl font-bold text-gray-900 mb-2">Rate your experience</Text>
          <Text className="text-gray-600 mb-4">How was your appointment with {providerName}?</Text>
          <View className="flex-row mb-4">
            {[1,2,3,4,5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <FontAwesome
                  name={rating >= star ? 'star' : 'star-o'}
                  size={32}
                  color={rating >= star ? '#F59E0B' : '#D1D5DB'}
                  style={{ marginHorizontal: 4 }}
                />
              </Pressable>
            ))}
          </View>
          <TextInput
            className="w-full border border-gray-200 rounded-lg p-3 mb-4 text-gray-900"
            placeholder="Leave feedback (optional)"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={3}
            style={{ minHeight: 60, textAlignVertical: 'top' }}
          />
          <View className="flex-row space-x-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-200 items-center"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => { if (rating > 0) onSubmit(rating, feedback); }}
              className={`flex-1 py-3 rounded-xl items-center ${rating > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
              disabled={rating === 0}
            >
              <Text className="text-white font-semibold">Submit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RatingPopup; 