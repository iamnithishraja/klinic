import { View, Text, Image, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { useDoctorStore } from '@/store/doctorStore';
import DoctorInfo from '@/components/doctor/DoctorInfo';
import Addresses from '@/components/doctor/Addresses';
import Slots from '@/components/doctor/Slots';
import Ratings from '@/components/doctor/Ratings';

export default function DoctorDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  
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

  const handleSelectSlot = (time: string) => {
    setSelectedSlot(time);
  };

  const handleSelectClinic = (clinic: any) => {
    setSelectedClinic(clinic);
  };

  const handleBookAppointment = () => {
    if (selectedSlot && selectedClinic) {
      alert(`Booking appointment with Dr. ${doctor?.user?.name} at ${selectedClinic.clinicName} for ${selectedSlot}`);
    } else {
      alert('Please select a clinic and time slot');
    }
  };

  const handleGoBack = () => {
    // Go back to previous screen using native navigation
    // Since we can't use router.back(), we'll use a workaround
    router.navigate('/doctors');
  };

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
        
        {/* Available Slots Section */}
        <View className="mt-6">
          <Text className="text-lg font-bold mb-3">Available Slots</Text>
          <Slots 
            availableSlots={doctor?.availableSlots || []} 
            availableDays={doctor?.availableDays || []}
            onSelectSlot={handleSelectSlot} 
          />
        </View>
        
        {/* Clinics Section */}
        <View className="mt-6">
          <Text className="text-lg font-bold mb-3">Clinics</Text>
          <Addresses 
            clinics={doctor.clinics || []} 
            onSelectClinic={handleSelectClinic} 
          />
        </View>
        
        {/* Space at the bottom for the floating button */}
        <View className="h-20" />
      </View>
    </SafeAreaView>
    </ScrollView>
    
    {/* Floating Book Appointment Button */}
    <Pressable 
      onPress={handleBookAppointment}
      className="bg-primary py-4 rounded-lg absolute bottom-6 left-6 right-6 shadow-lg"
    >
      <Text className="text-white text-center font-bold text-lg">
        Book Appointment
      </Text>
    </Pressable>
    </View>
  );
} 