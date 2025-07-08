import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Appointment, CollectedData } from './types';

interface CollectedSamplesProps {
  collectedSamples: CollectedData | null;
  formatAppointmentTime: (timeSlot: string, timeSlotDisplay: string) => string;
}

const CollectedSamples: React.FC<CollectedSamplesProps> = ({
  collectedSamples,
  formatAppointmentTime
}) => {
  const renderCollectedSample = ({ item }: { item: Appointment }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-orange-100">
      <View className="flex-row items-start mb-2">
        {/* Small lab icon or package cover image */}
        <View className="mr-3">
          {item.packageCoverImage ? (
            <Image
              source={{ uri: item.packageCoverImage }}
              className="w-12 h-12 rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-lg bg-orange-100 items-center justify-center">
              <FontAwesome name="vial" size={20} color="#F59E0B" />
            </View>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{item.providerName}</Text>
          <Text className="text-gray-600 text-sm">{item.serviceName}</Text>
          <Text className="text-gray-500 text-xs">{formatAppointmentTime(item.timeSlot, item.timeSlotDisplay)}</Text>
          
          {/* Status indicator */}
          <View className="flex-row items-center mt-2">
            <View className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
            <Text className="text-orange-700 text-xs font-medium">
              {item.status === 'collected' ? 'Sample Collected' : 'Processing'}
            </Text>
          </View>
        </View>
        
        <View className="bg-orange-100 px-3 py-1 rounded-lg">
          <Text className="text-orange-700 text-xs font-medium">In Progress</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="mb-8">
      <Text className="text-xl font-bold text-gray-900 mb-4">Sample Collections In Progress</Text>
      
      {collectedSamples?.labTests && collectedSamples.labTests.length > 0 ? (
        <FlatList
          data={collectedSamples.labTests}
          renderItem={renderCollectedSample}
          scrollEnabled={false}
        />
      ) : (
        <View className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-sm border border-orange-100 items-center">
          <View className="bg-orange-100 rounded-full p-3 mb-3">
            <FontAwesome name="vial" size={28} color="#F59E0B" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-1">Samples in progress</Text>
          <Text className="text-gray-600 text-center text-sm">
            Lab samples collected and being processed will appear here
          </Text>
        </View>
      )}
    </View>
  );
};

export default CollectedSamples; 