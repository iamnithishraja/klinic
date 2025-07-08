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

interface PreviousAppointmentsProps {
  previousAppointments: PreviousData | null;
  formatAppointmentTime: (timeSlot: string, timeSlotDisplay: string) => string;
  onViewPrescription: (appointmentId: string) => void;
  onShowPrescriptionsModal: () => void;
}

const PreviousAppointments: React.FC<PreviousAppointmentsProps> = ({
  previousAppointments,
  formatAppointmentTime,
  onViewPrescription,
  onShowPrescriptionsModal
}) => {
  const renderPreviousAppointment = ({ item }: { item: Appointment }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-start mb-2">
        {/* Small cover image or icon */}
        <View className="mr-3">
          {item.type === 'doctor' && item.doctor?.coverImage ? (
            <Image
              source={{ uri: item.doctor.coverImage }}
              className="w-12 h-12 rounded-lg"
              resizeMode="cover"
            />
          ) : item.type === 'doctor' ? (
            <View className="w-12 h-12 rounded-lg bg-blue-100 items-center justify-center">
              <FontAwesome name="user-md" size={20} color="#6366F1" />
            </View>
          ) : (
            <View className="w-12 h-12 rounded-lg bg-purple-100 items-center justify-center">
              <FontAwesome name="flask" size={20} color="#8B5CF6" />
            </View>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {item.type === 'doctor' ? `Dr. ${item.providerName}` : item.providerName}
          </Text>
          <Text className="text-gray-600 text-sm">{item.serviceName}</Text>
          <Text className="text-gray-500 text-xs">{formatAppointmentTime(item.timeSlot, item.timeSlotDisplay)}</Text>
        </View>
        
        {item.type === 'doctor' && item.prescription && (
          <Pressable
            onPress={() => onViewPrescription(item._id)}
            className="bg-blue-100 px-3 py-1 rounded-lg ml-2"
          >
            <Text className="text-blue-700 text-xs font-medium">View Prescription</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-gray-900">Previous Appointments</Text>
        
        {/* Quick Action Buttons */}
        <View className="flex-row space-x-2">
          <Pressable
            onPress={onShowPrescriptionsModal}
            className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center"
          >
            <FontAwesome name="stethoscope" size={12} color="white" style={{ marginRight: 4 }} />
            <Text className="text-white text-xs font-medium">Prescriptions</Text>
          </Pressable>
        </View>
      </View>
      
      {previousAppointments?.appointments && previousAppointments.appointments.length > 0 ? (
        <FlatList
          data={previousAppointments.appointments}
          renderItem={renderPreviousAppointment}
          scrollEnabled={false}
        />
      ) : (
        <View className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-100 items-center">
          <View className="bg-green-100 rounded-full p-3 mb-3">
            <FontAwesome name="clock-o" size={28} color="#059669" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-1">Your consultation history</Text>
          <Text className="text-gray-600 text-center text-sm">
            Previous appointments and prescriptions will appear here
          </Text>
        </View>
      )}
    </View>
  );
};

export default PreviousAppointments; 