import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  Alert
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Appointment, DashboardData } from './types';
import client from '../../api/client';
import TimeSlotPicker from '../TimeSlotPicker';

interface UpcomingAppointmentsProps {
  dashboardData: DashboardData | null;
  onJoinOnlineConsultation: (appointment: Appointment) => void;
  onGetDirections: (appointment: Appointment) => void;
  formatAppointmentTime: (timeSlot: string, timeSlotDisplay: string) => string;
  getAppointmentStatusColor: (appointment: Appointment) => string;
  canJoinNow: (timeSlot: string) => boolean;
  onAppointmentCancelled: () => void;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  dashboardData,
  onJoinOnlineConsultation,
  onGetDirections,
  formatAppointmentTime,
  getAppointmentStatusColor,
  canJoinNow,
  onAppointmentCancelled
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const handleNavigateToSection = (section: 'doctors' | 'laboratories') => {
    try {
      if (section === 'doctors') {
        router.push('/(tabs)/doctors');
      } else {
        router.push('/(tabs)/laboratories');
      }
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              const appointmentType = appointment.type === 'doctor' ? 'doctor' : 'laboratory';
              await client.delete(`/api/v1/${appointmentType}/${appointment._id}`);
              onAppointmentCancelled();
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleRescheduleConfirm = async (newTimeSlot: string) => {
    if (!selectedAppointment) return;

    try {
      const appointmentType = selectedAppointment.type === 'doctor' ? 'doctor' : 'laboratory';
      await client.put(`/api/v1/${appointmentType}/${selectedAppointment._id}/reschedule`, {
        timeSlot: newTimeSlot
      });
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      onAppointmentCancelled(); // This will refresh the appointments list
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      Alert.alert('Error', 'Failed to reschedule appointment. Please try again.');
    }
  };

  const renderUpcomingAppointment = ({ item }: { item: Appointment }) => (
    <View className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden" style={{ width: 300 }}>
      {/* Cover Image Section */}
      {item.type === 'doctor' && item.doctor ? (
        item.doctor.coverImage ? (
          <Image
            source={{ uri: item.doctor.coverImage }}
            className="w-full h-32"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-32 bg-gradient-to-r from-blue-100 to-indigo-100 items-center justify-center">
            <FontAwesome name="user-md" size={32} color="#6366F1" />
          </View>
        )
      ) : item.type === 'laboratory' ? (
        item.packageCoverImage ? (
          <Image
            source={{ uri: item.packageCoverImage }}
            className="w-full h-32"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-32 bg-gradient-to-r from-purple-100 to-violet-100 items-center justify-center">
            <FontAwesome name="flask" size={32} color="#8B5CF6" />
          </View>
        )
      ) : (
        <View className="w-full h-32 bg-gradient-to-r from-gray-100 to-gray-200 items-center justify-center">
          <FontAwesome name="hospital-o" size={32} color="#6B7280" />
        </View>
      )}

      <View className="p-5">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {item.type === 'doctor' ? `Dr. ${item.providerName}` : item.providerName}
            </Text>
            <Text className="text-gray-600 mb-2">{item.serviceName}</Text>
            <Text className="text-sm text-gray-500">{formatAppointmentTime(item.timeSlot, item.timeSlotDisplay)}</Text>
          </View>
          <View 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: `${getAppointmentStatusColor(item)}20` }}
          >
            <Text 
              className="text-xs font-medium"
              style={{ color: getAppointmentStatusColor(item) }}
            >
              {item.type === 'doctor' ? 
                (item.consultationType === 'online' ? 'Online' : 'In-Person') : 
                (item.collectionType === 'home' ? 'Home Collection' : 'Lab Visit')
              }
            </Text>
          </View>
        </View>

        <View className="space-y-3">
          {item.type === 'doctor' && item.consultationType === 'online' && (
            <Pressable
              onPress={() => onJoinOnlineConsultation(item)}
              disabled={!canJoinNow(item.timeSlot)}
              className={`py-3 px-4 rounded-xl flex-row items-center justify-center ${
                canJoinNow(item.timeSlot) ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <FontAwesome 
                name="video-camera" 
                size={16} 
                color="white" 
                style={{ marginRight: 8 }} 
              />
              <Text className="text-white font-medium">
                {canJoinNow(item.timeSlot) ? 'Join Now' : 'Join Later'}
              </Text>
            </Pressable>
          )}

          {item.type === 'doctor' && item.consultationType === 'in-person' && item.clinic && (
            <Pressable
              onPress={() => onGetDirections(item)}
              className="py-3 px-4 rounded-xl flex-row items-center justify-center bg-blue-500"
            >
              <FontAwesome 
                name="map-marker" 
                size={16} 
                color="white" 
                style={{ marginRight: 8 }} 
              />
              <Text className="text-white font-medium">Get Directions</Text>
            </Pressable>
          )}

          {item.type === 'laboratory' && item.collectionType === 'lab' && (
            <Pressable
              onPress={() => onGetDirections(item)}
              className="py-3 px-4 rounded-xl flex-row items-center justify-center bg-purple-500"
            >
              <FontAwesome 
                name="map-marker" 
                size={16} 
                color="white" 
                style={{ marginRight: 8 }} 
              />
              <Text className="text-white font-medium">Get Directions to Lab</Text>
            </Pressable>
          )}

          {item.type === 'laboratory' && item.collectionType === 'home' && (
            <View className="py-3 px-4 rounded-xl bg-orange-100 flex-row items-center justify-center">
              <FontAwesome 
                name="home" 
                size={16} 
                color="#ea580c" 
                style={{ marginRight: 8 }} 
              />
              <Text className="text-orange-700 font-medium">Home Collection Scheduled</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => handleRescheduleAppointment(item)}
              className="flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center bg-amber-500"
            >
              <FontAwesome 
                name="calendar" 
                size={16} 
                color="white" 
                style={{ marginRight: 8 }} 
              />
              <Text className="text-white font-medium">Reschedule</Text>
            </Pressable>
            <Pressable
              onPress={() => handleCancelAppointment(item)}
              className="flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center bg-red-500"
            >
              <FontAwesome 
                name="times" 
                size={16} 
                color="white" 
                style={{ marginRight: 8 }} 
              />
              <Text className="text-white font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View className="mb-8">
      <Text className="text-xl font-bold text-gray-900 mb-4">
        Upcoming Appointments ({dashboardData?.totalUpcoming || 0})
      </Text>
      
      {dashboardData?.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 ? (
        <FlatList
          data={dashboardData.upcomingAppointments}
          renderItem={renderUpcomingAppointment}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
          ItemSeparatorComponent={() => <View className="w-4" />}
        />
      ) : (
        <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-sm border border-blue-100 items-center">
          <View className="bg-blue-100 rounded-full p-4 mb-4">
            <FontAwesome name="calendar-plus-o" size={40} color="#4F46E5" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">Ready for your next consultation?</Text>
          <Text className="text-gray-600 text-center mb-6 leading-relaxed">
            Book appointments with top doctors and laboratories near you. Your health journey starts here!
          </Text>
          <View className="flex-row space-x-3">
            <Pressable 
              onPress={() => handleNavigateToSection('doctors')}
              className="bg-primary px-6 py-3 rounded-xl flex-row items-center"
            >
              <FontAwesome name="stethoscope" size={16} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-medium">Find Doctors</Text>
            </Pressable>
            <Pressable 
              onPress={() => handleNavigateToSection('laboratories')}
              className="bg-purple-500 px-6 py-3 rounded-xl flex-row items-center"
            >
              <FontAwesome name="flask" size={16} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-medium">Book Lab Tests</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <TimeSlotPicker
          visible={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
          }}
          onSelectTimeSlot={handleRescheduleConfirm}
          providerId={selectedAppointment.type === 'doctor' ? selectedAppointment.doctor?._id : selectedAppointment.lab?._id}
          providerType={selectedAppointment.type}
        />
      )}
    </View>
  );
};

export default UpcomingAppointments; 