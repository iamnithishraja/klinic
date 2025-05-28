import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

interface SlotsProps {
  availableSlots?: string[];
  availableDays?: string[];
  onSelectSlot?: (time: string) => void;
}

export default function Slots({ availableSlots = [], availableDays = [], onSelectSlot }: SlotsProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  // Get current date and time
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Filter available days to only show current day and future days
  const filteredDays = availableDays.filter(day => {
    const dayIndex = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    }[day];
    
    const currentDayIndex = now.getDay();
    
    // Only include days that are today or in the future
    return dayIndex !== undefined && (dayIndex >= currentDayIndex);
  });
  
  // Filter available slots to only show future times for the current day
  const filteredSlots = availableSlots.filter(slot => {
    // Parse the time from the slot (assuming format like "2:00 PM-3:00 PM" or "10:00 AM")
    const timeMatch = slot.match(/(\d+):(\d+)\s*(AM|PM)/);
    if (!timeMatch) return true; // If we can't parse, include it
    
    let slotHour = parseInt(timeMatch[1]);
    const slotMinute = parseInt(timeMatch[2]);
    const period = timeMatch[3];
    
    // Convert to 24-hour format
    if (period === 'PM' && slotHour < 12) slotHour += 12;
    if (period === 'AM' && slotHour === 12) slotHour = 0;
    
    // If it's the current day, only show future times
    if (availableDays.includes(currentDay)) {
      if (slotHour < currentHour) return false;
      if (slotHour === currentHour && slotMinute <= currentMinute) return false;
    }
    
    return true;
  });

  if (filteredSlots.length === 0) {
    return (
      <View className="bg-gray-50 p-4 rounded-lg">
        <Text className="text-gray-600 text-center">No available slots for today</Text>
      </View>
    );
  }

  // Display available days if provided
  const renderAvailableDays = () => {
    if (!filteredDays || filteredDays.length === 0) return null;
    
    return (
      <View className="mb-4">
        <Text className="text-gray-600 mb-2">Available on:</Text>
        <View className="flex-row flex-wrap">
          {filteredDays.map((day, index) => (
            <View 
              key={index} 
              className={`px-3 py-1 rounded-full mr-2 mb-2 ${day === currentDay ? 'bg-primary/20' : 'bg-gray-100'}`}
            >
              <Text className={`${day === currentDay ? 'text-primary font-medium' : 'text-gray-700'}`}>{day}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View>
      {renderAvailableDays()}
      
      {/* Time Slots */}
      <View className="flex-row flex-wrap">
        {filteredSlots.map((slot, index) => (
          <Pressable
            key={index}
            onPress={() => {
              setSelectedSlot(slot);
              if (onSelectSlot) {
                onSelectSlot(slot);
              }
            }}
            className={`mr-2 mb-2 px-4 py-2 rounded-lg ${selectedSlot === slot ? 'bg-primary' : 'bg-gray-100'}`}
          >
            <Text
              className={`text-center ${selectedSlot === slot ? 'text-white' : 'text-gray-700'}`}
            >
              {slot}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
