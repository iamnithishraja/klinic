import { View, Text, Image, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { useDoctorStore } from '@/store/doctorStore';
import DoctorInfo from '@/components/doctor/DoctorInfo';
import Addresses from '@/components/doctor/Addresses';
import { useLocalSearchParams, useRouter } from 'expo-router';


// Updated Slots component for day selection
interface SlotsProps {
  availableSlots?: string[];
  availableDays?: string[];
  onSelectSlot?: (day: string, time: string) => void;
  selectedDay?: string | null;
  selectedSlot?: string | null;
}

function Slots({ availableSlots = [], availableDays = [], onSelectSlot, selectedDay, selectedSlot }: SlotsProps) {
  // Get current date and time
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Filter available days to only show current day and future days
  const filteredDays = availableDays.filter(day => {
    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
    const currentDayIndex = now.getDay();
    
    // Only include days that are today or in the future
    return dayIndex !== -1 && (dayIndex >= currentDayIndex);
  });
  
  // Filter available slots based on selected day
  const filteredSlots = availableSlots.filter(slot => {
    // If today is selected, filter out past times
    if (selectedDay === currentDay) {
      const timeMatch = slot.match(/(\d+):(\d+)\s*(AM|PM)/);
      if (!timeMatch) return true;
      
      let slotHour = parseInt(timeMatch[1]);
      const slotMinute = parseInt(timeMatch[2]);
      const period = timeMatch[3];
      
      // Convert to 24-hour format
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

// Consultation Type Selector Component
interface ConsultationTypeSelectorProps {
  consultationType: 'in-person' | 'online' | 'both';
  selectedType?: 'in-person' | 'online' | null;
  onSelectType: (type: 'in-person' | 'online') => void;
}

function ConsultationTypeSelector({ consultationType, selectedType, onSelectType }: ConsultationTypeSelectorProps) {
  const options = consultationType === 'both' 
    ? ['in-person', 'online'] 
    : [consultationType];

  return (
    <View>
      <Text className="text-lg font-bold mb-3">Consultation Type</Text>
      <View className="flex-row flex-wrap">
        {options.map((type) => (
          <Pressable
            key={type}
            onPress={() => onSelectType(type as 'in-person' | 'online')}
            className={`mr-3 mb-2 px-4 py-3 rounded-lg border ${
              selectedType === type 
                ? 'bg-primary border-primary' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <View className="flex-row items-center">
              <FontAwesome 
                name={type === 'in-person' ? 'hospital-o' : 'video-camera'} 
                size={16} 
                color={selectedType === type ? 'white' : '#4B5563'} 
              />
              <Text className={`ml-2 capitalize font-medium ${
                selectedType === type ? 'text-white' : 'text-gray-700'
              }`}>
                {type === 'in-person' ? 'In-Person' : 'Online'}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function DoctorDetails() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [selectedConsultationType, setSelectedConsultationType] = useState<'in-person' | 'online' | null>(null);
  
  // Get doctors from the Zustand store
  const { doctors } = useDoctorStore();
  
  // Find the doctor by ID from the store
  const doctor = doctors.find((doc: any) => doc._id === id) || null;

  useEffect(() => {
    if (doctors.length > 0) {
      setLoading(false);
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [doctors, id]);

  // Auto-select consultation type if doctor only offers one option
  useEffect(() => {
    if (doctor && doctor.consultationType !== 'both' && !selectedConsultationType) {
      setSelectedConsultationType(doctor.consultationType);
    }
  }, [doctor, selectedConsultationType]);

  const handleSelectSlot = (day: string, time: string) => {
    if (time === '') {
      // Day selection - clear time slot if day changes
      if (selectedDay !== day) {
        setSelectedSlot(null);
      }
      setSelectedDay(day);
    } else {
      // Time slot selection
      setSelectedDay(day);
      setSelectedSlot(time);
    }
  };

  const handleSelectClinic = (clinic: any) => {
    setSelectedClinic(clinic);
  };

  const handleSelectConsultationType = (type: 'in-person' | 'online') => {
    setSelectedConsultationType(type);
    // Clear clinic selection when switching between consultation types
    if (type === 'online') {
      setSelectedClinic(null);
    }
  };

  const handleBookAppointment = () => {
    const isInPerson = selectedConsultationType === 'in-person';
    const clinicRequired = isInPerson && !selectedClinic;
    
    if (selectedSlot && selectedDay && selectedConsultationType && !clinicRequired) {
      const bookingDetails = `Booking appointment with Dr. ${doctor?.user?.name}
Date: ${selectedDay}
Time: ${selectedSlot}
Type: ${selectedConsultationType === 'in-person' ? 'In-Person' : 'Online'}${isInPerson && selectedClinic ? `\nClinic: ${selectedClinic.clinicName}` : ''}`;
      
      alert(bookingDetails);
    } else {
      const missing = [];
      if (!selectedConsultationType) missing.push('consultation type');
      if (!selectedDay) missing.push('day');
      if (!selectedSlot) missing.push('time slot');
      if (clinicRequired) missing.push('clinic (required for in-person consultation)');
      
      alert(`Please select: ${missing.join(', ')}`);
    }
  };

  const handleGoBack = () => {
    router.navigate('/doctors');
  };

  // Check if all selections are made for button enabling
  const isInPersonConsultation = selectedConsultationType === 'in-person';
  const clinicRequiredAndSelected = !isInPersonConsultation || selectedClinic;
  const isBookingEnabled = !!(selectedSlot && selectedDay && selectedConsultationType && clinicRequiredAndSelected);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Doctor not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView>
        <SafeAreaView>
          {/* Header with Back Button */}
          <View className="relative">
            {/* Cover Image or Default Cover */}
            {doctor.coverImage ? (
              <Image
                source={{ uri: doctor.coverImage }}
                resizeMode="stretch"
                className="w-full h-56"
              />
            ) : (
              <View className="w-full h-56 bg-gray-100 items-center justify-center">
                <FontAwesome name="hospital-o" size={64} color="#9CA3AF" />
              </View>
            )}
            
            {/* Back Button */}
            <Pressable 
              onPress={handleGoBack}
              className="absolute top-12 left-4 bg-white/80 p-2 rounded-full"
            >
              <FontAwesome name="arrow-left" size={20} color="#333" />
            </Pressable>
          </View>

          {/* Content Container */}
          <View className="bg-white p-4 -mt-6 rounded-t-3xl">
            {/* Doctor Info Component */}
            <DoctorInfo doctor={doctor} />
            
            {/* Consultation Type Selection */}
            <View className="mt-6">
              <Text className="text-lg font-bold mb-3">Choose Consultation Type</Text>
              <Text className="text-gray-600 mb-3">
                {doctor.consultationType === 'both' 
                  ? 'This doctor offers both consultation types. Please select your preference:'
                  : `This doctor offers ${doctor.consultationType === 'in-person' ? 'in-person' : 'online'} consultation only.`
                }
              </Text>
              <ConsultationTypeSelector 
                consultationType={doctor.consultationType}
                selectedType={selectedConsultationType}
                onSelectType={handleSelectConsultationType}
              />
            </View>
            
            {/* Available Slots Section */}
            <View className="mt-6">
              <Text className="text-lg font-bold mb-3">Available Slots</Text>
              <Slots 
                availableSlots={doctor?.availableSlots || []} 
                availableDays={doctor?.availableDays || []}
                onSelectSlot={handleSelectSlot}
                selectedDay={selectedDay}
                selectedSlot={selectedSlot}
              />
            </View>
            
            {/* Clinics Section - Always show but disable for online consultations */}
            <View className="mt-6">
              <Text className="text-lg font-bold mb-3">Clinic Information</Text>
              <Text className="text-gray-600 mb-3">
                {selectedConsultationType === 'online' 
                  ? 'Clinic selection not required for online consultations'
                  : selectedConsultationType === 'in-person'
                    ? 'Choose a clinic for your in-person appointment:'
                    : 'Available clinic locations:'
                }
              </Text>
              <View className={selectedConsultationType === 'online' ? 'opacity-50' : ''}>
                <Addresses 
                  clinics={doctor.clinics || []} 
                  onSelectClinic={selectedConsultationType === 'online' ? undefined : handleSelectClinic}
                  disabled={selectedConsultationType === 'online'}
                />
              </View>
            </View>
            
            {/* Selection Summary */}
            <View className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-200">
              <Text className="text-lg font-bold mb-3 text-blue-900">Booking Summary</Text>
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <FontAwesome 
                    name={selectedConsultationType ? "check-circle" : "circle-o"} 
                    size={16} 
                    color={selectedConsultationType ? "#059669" : "#9CA3AF"} 
                  />
                  <Text className={`ml-2 ${selectedConsultationType ? 'text-green-700' : 'text-gray-500'}`}>
                    Consultation Type: {selectedConsultationType ? (selectedConsultationType === 'in-person' ? 'In-Person' : 'Online') : 'Not selected'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <FontAwesome 
                    name={selectedDay ? "check-circle" : "circle-o"} 
                    size={16} 
                    color={selectedDay ? "#059669" : "#9CA3AF"} 
                  />
                  <Text className={`ml-2 ${selectedDay ? 'text-green-700' : 'text-gray-500'}`}>
                    Day: {selectedDay || 'Not selected'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <FontAwesome 
                    name={selectedSlot ? "check-circle" : "circle-o"} 
                    size={16} 
                    color={selectedSlot ? "#059669" : "#9CA3AF"} 
                  />
                  <Text className={`ml-2 ${selectedSlot ? 'text-green-700' : 'text-gray-500'}`}>
                    Time: {selectedSlot || 'Not selected'}
                  </Text>
                </View>
                {/* Show clinic selection only for in-person consultations */}
                {selectedConsultationType === 'in-person' && (
                  <View className="flex-row items-center">
                    <FontAwesome 
                      name={selectedClinic ? "check-circle" : "circle-o"} 
                      size={16} 
                      color={selectedClinic ? "#059669" : "#9CA3AF"} 
                    />
                    <Text className={`ml-2 ${selectedClinic ? 'text-green-700' : 'text-gray-500'}`}>
                      Clinic: {selectedClinic?.clinicName || 'Not selected'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Space at the bottom for the floating button */}
            <View className="h-20" />
          </View>
        </SafeAreaView>
      </ScrollView>
      
      {/* Floating Book Appointment Button */}
      <Pressable 
        onPress={handleBookAppointment}
        disabled={!isBookingEnabled}
        className={`py-4 rounded-lg absolute bottom-6 left-6 right-6 shadow-lg ${
          isBookingEnabled ? 'bg-primary' : 'bg-gray-400'
        }`}
      >
        <Text className="text-white text-center font-bold text-lg">
          {isBookingEnabled ? 'Book Appointment' : 'Complete All Selections'}
        </Text>
      </Pressable>
    </View>
  );
} 