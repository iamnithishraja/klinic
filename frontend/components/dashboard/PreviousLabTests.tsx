import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Appointment, PreviousData } from './types';

interface PreviousLabTestsProps {
  previousLabTests: PreviousData | null;
  formatAppointmentTime: (timeSlot: string, timeSlotDisplay: string) => string;
  onViewLabReport: (testId: string) => void;
  onViewLabPdfs: (testId: string) => void;
  onViewLabNotes: (testId: string) => void;
  onShowAllReportsModal: () => void;
}

const PreviousLabTests: React.FC<PreviousLabTestsProps> = ({
  previousLabTests,
  formatAppointmentTime,
  onViewLabReport,
  onViewLabPdfs,
  onViewLabNotes,
  onShowAllReportsModal
}) => {
  const renderPreviousLabTest = ({ item }: { item: Appointment }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-start mb-3">
        {/* Small lab icon or package cover image */}
        <View className="mr-3">
          {item.packageCoverImage ? (
            <Image
              source={{ uri: item.packageCoverImage }}
              className="w-12 h-12 rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-lg bg-purple-100 items-center justify-center">
              <FontAwesome name="flask" size={20} color="#8B5CF6" />
            </View>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{item.providerName}</Text>
          <Text className="text-gray-600 text-sm">{item.serviceName}</Text>
          <Text className="text-gray-500 text-xs">{formatAppointmentTime(item.timeSlot, item.timeSlotDisplay)}</Text>
        </View>
      </View>
      
      {/* Three Action Buttons */}
      {item.reportResult && (
        <View className="flex-row space-x-2">
          <Pressable
            onPress={() => onViewLabReport(item._id)}
            className="flex-1 bg-purple-100 px-3 py-2 rounded-lg items-center border border-purple-200"
          >
            <FontAwesome name="file-text" size={12} color="#8B5CF6" style={{ marginBottom: 2 }} />
            <Text className="text-purple-700 text-xs font-medium">Report</Text>
          </Pressable>
          
          <Pressable
            onPress={() => onViewLabPdfs(item._id)}
            className="flex-1 bg-red-100 px-3 py-2 rounded-lg items-center border border-red-200"
          >
            <FontAwesome name="file-pdf-o" size={12} color="#EF4444" style={{ marginBottom: 2 }} />
            <Text className="text-red-700 text-xs font-medium">PDFs</Text>
          </Pressable>
          
          <Pressable
            onPress={() => onViewLabNotes(item._id)}
            className="flex-1 bg-blue-100 px-3 py-2 rounded-lg items-center border border-blue-200"
          >
            <FontAwesome name="sticky-note" size={12} color="#3B82F6" style={{ marginBottom: 2 }} />
            <Text className="text-blue-700 text-xs font-medium">Notes</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-gray-900">Previous Lab Tests</Text>
        
        {/* Quick Action Buttons */}
        <View className="flex-row space-x-2">
          <Pressable
            onPress={onShowAllReportsModal}
            className="bg-purple-500 px-3 py-2 rounded-lg flex-row items-center"
          >
            <FontAwesome name="list" size={12} color="white" style={{ marginRight: 4 }} />
            <Text className="text-white text-xs font-medium">All Reports</Text>
          </Pressable>
        </View>
      </View>
      
      {previousLabTests?.labTests && previousLabTests.labTests.length > 0 ? (
        <FlatList
          data={previousLabTests.labTests}
          renderItem={renderPreviousLabTest}
          scrollEnabled={false}
        />
      ) : (
        <View className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 shadow-sm border border-purple-100 items-center">
          <View className="bg-purple-100 rounded-full p-3 mb-3">
            <FontAwesome name="heartbeat" size={28} color="#8B5CF6" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-1">Your health reports</Text>
          <Text className="text-gray-600 text-center text-sm">
            Lab test results and health reports will be available here
          </Text>
        </View>
      )}
    </View>
  );
};

export default PreviousLabTests; 