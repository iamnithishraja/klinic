import { View, Text, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface Review {
  id: string;
  user: {
    name: string;
    profilePicture?: string;
  };
  rating: number;
  comment: string;
  date: string;
}

interface RatingsProps {
  rating: number;
}

export default function Ratings({ rating }: RatingsProps) {
  // Generate an array of 5 stars with filled or unfilled state
  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <FontAwesome
          key={i}
          name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half-o' : 'star-o'}
          size={16}
          color="#FFD700"
          style={{ marginRight: 2 }}
        />
      ));
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View>
      {/* Rating Summary */}
      <View className="flex-row items-center">
        <View className="bg-primary/10 px-3 py-2 rounded-lg mr-3">
          <Text className="text-primary text-xl font-bold">{rating > 0 ? rating.toFixed(1) : 'N/A'}</Text>
        </View>
        <View>
          <View className="flex-row">{renderStars(rating)}</View>
        </View>
      </View>
    </View>
  );
}
