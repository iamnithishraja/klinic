import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Laboratory } from '../services/laboratoryService';
import { FontAwesome } from '@expo/vector-icons';

interface LaboratoryCardProps {
  laboratory: Laboratory;
}

export default function LaboratoryCard({ laboratory }: LaboratoryCardProps) {
  const router = useRouter();

  const handleViewDetails = (serviceIndex: number) => {
    router.push(`/laboratories/${laboratory._id}?serviceIndex=${serviceIndex}`);
  };

  return (
    <View className="mb-4 mx-4 mt-4">
      {/* Services Cards */}
      {laboratory.laboratoryServices.map((service, index) => (
        <Pressable
          key={index}
          onPress={() => handleViewDetails(index)}
          className="bg-white rounded-xl overflow-hidden shadow-lg mb-6 border border-gray-100"
        >
          {/* Service Cover Image */}
          {service.coverImage ? (
            <Image
              source={{ uri: service.coverImage }}
              className="w-full h-40"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-40 bg-gray-100 items-center justify-center">
              <FontAwesome name="flask" size={40} color="#9CA3AF" />
            </View>
          )}

          <View className="p-4">
            {/* Laboratory Info */}
            <View className="mb-3 pb-3 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">{laboratory.laboratoryName}</Text>
              <View className="flex-row flex-wrap mt-2">
                <View className="flex-row items-center mr-4">
                  <FontAwesome name="phone" size={14} color="#4B5563" />
                  <Text className="text-gray-600 text-sm ml-2">{laboratory.user?.phone}</Text>
                </View>
                <View className="flex-row items-center">
                  <FontAwesome name="map-marker" size={14} color="#4B5563" />
                  <Text className="text-gray-600 text-sm ml-2">
                    {laboratory.laboratoryAddress.address}, {laboratory.laboratoryAddress.pinCode}
                  </Text>
                </View>
              </View>
            </View>

            {/* Service Header */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">{service.name}</Text>
                <Text className="text-base text-gray-600 mt-1">{service.category}</Text>
              </View>
              <View className="bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
                <Text className="text-xs text-gray-500 mb-1">Package Fee</Text>
                <Text className="text-primary font-bold text-lg">₹{service.price}</Text>
              </View>
            </View>

            {/* Service Rating */}
            <View className="flex-row items-center mt-3">
              <FontAwesome name="star" size={14} color="#FFD700" />
              <Text className="text-gray-600 ml-2">{service.rating}/5</Text>
            </View>

            {/* Service Description */}
            {service.description && (
              <Text className="text-gray-600 mt-3 text-sm" numberOfLines={2}>
                {service.description}
              </Text>
            )}

            {/* Collection Type */}
            <View className="flex-row items-center mt-3">
              <View className={`flex-row items-center px-3 py-1.5 rounded-full ${
                service.collectionType === 'home' ? 'bg-green-100' :
                service.collectionType === 'lab' ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
                <FontAwesome 
                  name={service.collectionType === 'lab' ? 'hospital-o' : 'home'} 
                  size={14} 
                  color={
                    service.collectionType === 'home' ? '#059669' :
                    service.collectionType === 'lab' ? '#2563EB' : '#7C3AED'
                  } 
                />
                <Text className={`ml-2 text-sm ${
                  service.collectionType === 'home' ? 'text-green-700' :
                  service.collectionType === 'lab' ? 'text-blue-700' : 'text-purple-700'
                }`}>
                  {service.collectionType === 'both' 
                    ? 'Home & Lab' 
                    : service.collectionType === 'home' 
                      ? 'Home Collection' 
                      : 'Lab Visit'}
                </Text>
              </View>
            </View>

            {/* Tests Section */}
            {service.tests && service.tests.length > 0 && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Included Tests ({service.tests.length}):
                </Text>
                {service.tests.slice(0, 3).map((test, testIndex) => (
                  <View key={testIndex} className="mb-2 bg-gray-50 p-2 rounded-lg">
                    <Text className="text-sm font-medium text-gray-800">{test.name}</Text>
                    {test.description && (
                      <Text className="text-xs text-gray-600 mt-1" numberOfLines={2}>
                        {test.description}
                      </Text>
                    )}
                  </View>
                ))}
                {service.tests.length > 3 && (
                  <Text className="text-xs text-primary mt-2">
                    +{service.tests.length - 3} more tests
                  </Text>
                )}
              </View>
            )}

            {/* Book Now Button */}
            <View className="mt-4 flex-row justify-end">
              <Pressable 
                onPress={() => handleViewDetails(index)}
                className="bg-primary px-4 py-2.5 rounded-lg flex-row items-center"
              >
                <Text className="text-white font-semibold mr-2">Book Now</Text>
                <FontAwesome name="arrow-right" size={14} color="white" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
} 