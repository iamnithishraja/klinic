import { View, Text, Pressable } from 'react-native';

interface SlotsProps {
  availableSlots?: string[];
  availableDays?: string[];
  onSelectSlot?: (day: string, time: string) => void;
  selectedDay?: string | null;
  selectedSlot?: string | null;
}

export default function Slots({ availableSlots = [], availableDays = [], onSelectSlot, selectedDay, selectedSlot }: SlotsProps) {
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

  if (filteredDays.length === 0) {
    return (
      <View className="bg-gray-50 p-4 rounded-lg">
        <Text className="text-gray-600 text-center">No available days</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Available Days */}
      <View className="mb-4">
        <Text className="text-gray-600 mb-2 font-medium">Select Day:</Text>
        <View className="flex-row flex-wrap">
          {filteredDays.map((day, index) => (
            <Pressable
              key={index}
              onPress={() => onSelectSlot && onSelectSlot(day, '')}
              className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                selectedDay === day ? 'bg-primary' : 'bg-gray-100'
              }`}
            >
              <Text className={`${selectedDay === day ? 'text-white font-medium' : 'text-gray-700'}`}>
                {day}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      {/* Time Slots - only show if day is selected */}
      {selectedDay && (
        <View>
          <Text className="text-gray-600 mb-2 font-medium">Select Time:</Text>
          {filteredSlots.length === 0 ? (
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="text-gray-600 text-center">No available slots for {selectedDay}</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {filteredSlots.map((slot, index) => (
                <Pressable
                  key={index}
                  onPress={() => onSelectSlot && onSelectSlot(selectedDay, slot)}
                  className={`mr-2 mb-2 px-4 py-2 rounded-lg ${
                    selectedSlot === slot ? 'bg-primary' : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-center ${selectedSlot === slot ? 'text-white' : 'text-gray-700'}`}>
                    {slot}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
} 