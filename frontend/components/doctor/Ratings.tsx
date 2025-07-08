import { View, Text, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import StarRating from '../StarRating';

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
  // Use the new StarRating component
  const renderStars = (rating: number) => {
    return <StarRating rating={rating} size="medium" showRating={false} />;
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
