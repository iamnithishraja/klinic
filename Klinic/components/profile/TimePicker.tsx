import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onTimeSelected: (time: string) => void;
  mode: 'start' | 'end';
}

const TimePicker = ({ visible, onClose, onTimeSelected, mode }: TimePickerProps) => {
  const [tempHour, setTempHour] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempAmPm, setTempAmPm] = useState('AM');

  const handleTimeSelection = () => {
    const formattedHour = tempHour % 12 || 12;
    const formattedMinute = tempMinute < 10 ? `0${tempMinute}` : tempMinute;
    const time = `${formattedHour}:${formattedMinute} ${tempAmPm}`;
    onTimeSelected(time);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
        <View className="bg-white p-4 rounded-xl w-80">
          <Text className="text-gray-800 font-medium text-lg mb-4 text-center">
            Select {mode === 'start' ? 'Start' : 'End'} Time
          </Text>
          
          <View className="flex-row justify-center items-center mb-4">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setTempHour((prev) => (prev > 1 ? prev - 1 : 12))}
                className="p-2"
              >
                <MaterialCommunityIcons name="chevron-up" size={24} color="#6366F1" />
              </TouchableOpacity>
              <Text className="text-2xl font-medium mx-2">{tempHour}</Text>
              <TouchableOpacity
                onPress={() => setTempHour((prev) => (prev < 12 ? prev + 1 : 1))}
                className="p-2"
              >
                <MaterialCommunityIcons name="chevron-down" size={24} color="#6366F1" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-2xl font-medium mx-2">:</Text>
            
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setTempMinute((prev) => (prev > 0 ? prev - 1 : 59))}
                className="p-2"
              >
                <MaterialCommunityIcons name="chevron-up" size={24} color="#6366F1" />
              </TouchableOpacity>
              <Text className="text-2xl font-medium mx-2">
                {tempMinute < 10 ? `0${tempMinute}` : tempMinute}
              </Text>
              <TouchableOpacity
                onPress={() => setTempMinute((prev) => (prev < 59 ? prev + 1 : 0))}
                className="p-2"
              >
                <MaterialCommunityIcons name="chevron-down" size={24} color="#6366F1" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={() => setTempAmPm((prev) => (prev === 'AM' ? 'PM' : 'AM'))}
              className="ml-4 p-2 bg-gray-100 rounded-lg"
            >
              <Text className="text-gray-800 font-medium">{tempAmPm}</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row justify-end">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 mr-2"
            >
              <Text className="text-gray-600">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleTimeSelection}
              className="px-4 py-2 bg-primary rounded-lg"
            >
              <Text className="text-white font-medium">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TimePicker; 