import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Laboratory } from '../../../services/laboratoryService';
import { FontAwesome } from '@expo/vector-icons';

export default function LaboratoryDetails() {
  const { id } = useLocalSearchParams();
  const [laboratory, setLaboratory] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch laboratory details using the ID
    // This would typically be a call to your API
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!laboratory) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Laboratory not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Cover Image or Default Cover */}
      {laboratory.user.profilePicture ? (
        <Image
          source={{ uri: laboratory.user.profilePicture }}
          className="w-full h-48"
        />
      ) : (
        <View className="w-full h-48 bg-gray-100 items-center justify-center">
          <FontAwesome name="flask" size={64} color="#9CA3AF" />
        </View>
      )}

      {/* Laboratory Info */}
      <View className="bg-white p-4 -mt-6 rounded-t-3xl">
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-xl font-bold">{laboratory.laboratoryName}</Text>
            <Text className="text-gray-600">{laboratory.laboratoryAddress.city}</Text>
            <View className="flex-row items-center mt-1">
              <FontAwesome name="star" size={16} color="#FFD700" />
              <Text className="text-gray-600 ml-1">{laboratory.rating}/5</Text>
            </View>
          </View>
        </View>

        {/* Quick Info */}
        <View className="flex-row justify-between mt-4 bg-gray-50 p-4 rounded-lg">
          <View className="items-center">
            <Text className="text-gray-600">Services</Text>
            <Text className="font-bold">{laboratory.laboratoryServices.length}</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-600">Starting From</Text>
            <Text className="font-bold">
              ₹{Math.min(...laboratory.laboratoryServices.map(s => s.price))}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-600">Collection</Text>
            <Text className="font-bold">{laboratory.laboratoryServices[0]?.collectionType}</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View className="mt-4">
          <Text className="text-lg font-bold mb-2">Contact Information</Text>
          <Text className="text-gray-600">Phone: {laboratory.user.phone}</Text>
          <Text className="text-gray-600">Email: {laboratory.user.email}</Text>
          <Text className="text-gray-600">
            Address: {laboratory.laboratoryAddress.address}
          </Text>
          <Text className="text-gray-600">
            Pin Code: {laboratory.laboratoryAddress.pinCode}
          </Text>
        </View>

        {/* Services */}
        <View className="mt-4">
          <Text className="text-lg font-bold mb-2">Available Services</Text>
          {laboratory.laboratoryServices.map((service, index) => (
            <View key={index} className="bg-gray-50 p-4 rounded-lg mb-2">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="font-bold">{service.name}</Text>
                  <Text className="text-gray-600">Category: {service.category}</Text>
                  <Text className="text-gray-600">Collection: {service.collectionType}</Text>
                </View>
                <View>
                  <Text className="text-lg font-bold text-primary">₹{service.price}</Text>
                  <View className="flex-row items-center">
                    <FontAwesome name="star" size={12} color="#FFD700" />
                    <Text className="text-gray-600 ml-1">{service.rating}/5</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Book Test Button */}
        <Pressable className="bg-primary py-4 rounded-lg mt-6">
          <Text className="text-white text-center font-bold text-lg">
            Book Test
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
} 