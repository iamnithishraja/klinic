import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import RatingDisplay from '../RatingDisplay';

interface ServiceInfoProps {
  service: {
    _id?: string; // Add service ID field
    name: string;
    category: string;
    price: number;
    collectionType: string;
    rating: number;
    description: string;
    tests?: Array<{
      name: string;
      description: string;
    }>;
  };
  laboratoryName: string;
  laboratoryId: string;
}

export default function ServiceInfo({ service, laboratoryName, laboratoryId }: ServiceInfoProps) {
  // Use service ID if available, otherwise fall back to laboratory ID for backward compatibility
  const ratingProviderId = service._id || laboratoryId;
  
  return (
    <View>
      {/* Service Header */}
      <View className="mb-4">
        <Text className="text-2xl font-bold text-primary">{service.name}</Text>
        <Text className="text-gray-600 text-lg">at {laboratoryName}</Text>
        <View className="flex-row items-center mt-2">
          <RatingDisplay 
            providerId={service._id || ''} // This is the laboratory service ID
            providerType="laboratoryService" 
            size="medium"
          />
          <Text className="text-gray-400 mx-2">•</Text>
          <Text className="text-gray-600">{service.category}</Text>
        </View>
      </View>

      {/* Service Details */}
      <View className="bg-blue-50 p-4 rounded-lg mb-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-bold text-blue-900 mb-2">Service Details</Text>
            <Text className="text-blue-800 mb-2">{service.description}</Text>
            <View className="flex-row items-center">
              <FontAwesome name="flask" size={14} color="#3B82F6" />
              <Text className="text-blue-800 ml-2">Collection: {service.collectionType}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-2xl font-bold text-primary">₹{service.price}</Text>
            <Text className="text-gray-600 text-sm">per package</Text>
          </View>
        </View>
      </View>

      {/* Tests Included */}
      {service.tests && service.tests.length > 0 && (
        <View className="bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-bold mb-3">Tests Included</Text>
          {service.tests.map((test, index) => (
            <View key={index} className="mb-2">
              <View className="flex-row items-center">
                <FontAwesome name="check-circle" size={16} color="#059669" />
                <Text className="text-gray-900 font-medium ml-2">{test.name}</Text>
              </View>
              {test.description && (
                <Text className="text-gray-600 text-sm ml-6">{test.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
} 