import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import client from '../api/client';

interface TimeSlotPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectTimeSlot: (timeSlot: string) => void;
  providerId: string;
  providerType: 'doctor' | 'laboratory';
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  visible,
  onClose,
  onSelectTimeSlot,
  providerId,
  providerType
}) => {
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && providerId) {
      fetchAvailability();
    }
  }, [visible, providerId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const endpoint = providerType === 'doctor' 
        ? `/api/v1/doctor/${providerId}/availability`
        : `/api/v1/laboratory/${providerId}/availability`;
      
      const response = await client.get(endpoint);
      setAvailableDays(response.data.availableDays || []);
      setAvailableSlots(response.data.availableSlots || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDaySelect = (day: string) => {
    setSelectedDay(day);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    onSelectTimeSlot(`${selectedDay} ${slot}`);
    onClose();
  };

  // Get current date and time
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Filter available days to only show current day and future days
  const filteredDays = availableDays.filter(day => {
    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
    const currentDayIndex = now.getDay();
    return dayIndex !== -1 && (dayIndex >= currentDayIndex);
  });

  // Filter available slots based on selected day
  const filteredSlots = availableSlots.filter(slot => {
    if (selectedDay === currentDay) {
      const timeMatch = slot.match(/(\d+):(\d+)\s*(AM|PM)/);
      if (!timeMatch) return true;
      
      let slotHour = parseInt(timeMatch[1]);
      const slotMinute = parseInt(timeMatch[2]);
      const period = timeMatch[3];
      
      if (period === 'PM' && slotHour < 12) slotHour += 12;
      if (period === 'AM' && slotHour === 12) slotHour = 0;
      
      if (slotHour < currentHour) return false;
      if (slotHour === currentHour && slotMinute <= currentMinute) return false;
    }
    return true;
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-xl w-[90%] max-w-md p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-900">
              Select New Time
            </Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-8">
              <Text className="text-gray-600 text-center">Loading available slots...</Text>
            </View>
          ) : (
            <ScrollView>
              {/* Available Days */}
              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-3">Select Day:</Text>
                <View className="flex-row flex-wrap">
                  {filteredDays.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleDaySelect(day)}
                      className={`mr-2 mb-2 px-4 py-2 rounded-lg ${
                        selectedDay === day ? 'bg-primary' : 'bg-gray-100'
                      }`}
                    >
                      <Text className={selectedDay === day ? 'text-white' : 'text-gray-700'}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time Slots */}
              {selectedDay && (
                <View>
                  <Text className="text-gray-700 font-medium mb-3">Select Time:</Text>
                  {filteredSlots.length === 0 ? (
                    <Text className="text-gray-600 text-center py-4">
                      No available slots for {selectedDay}
                    </Text>
                  ) : (
                    <View className="flex-row flex-wrap">
                      {filteredSlots.map((slot, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleSlotSelect(slot)}
                          className={`mr-2 mb-2 px-4 py-2 rounded-lg ${
                            selectedSlot === slot ? 'bg-primary' : 'bg-gray-100'
                          }`}
                        >
                          <Text className={selectedSlot === slot ? 'text-white' : 'text-gray-700'}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default TimeSlotPicker; 