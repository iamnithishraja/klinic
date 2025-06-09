import { View, Text, Image, ScrollView, Pressable, SafeAreaView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { useLaboratoryStore } from '@/store/laboratoryStore';
// @ts-ignore
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient from '@/api/client';

// Import separated components
import ServiceInfo from '@/components/laboratory/ServiceInfo';
import CollectionTypeSelector from '@/components/laboratory/CollectionTypeSelector';
import Slots from '@/components/laboratory/Slots';
import LaboratoryAddress from '@/components/laboratory/LaboratoryAddress';

export default function LaboratoryServiceDetails() {
  const { id, serviceIndex } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [laboratory, setLaboratory] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedCollectionType, setSelectedCollectionType] = useState<'lab' | 'home' | null>(null);
  
  // Get laboratories from the Zustand store
  const { laboratories, searchLaboratories } = useLaboratoryStore();
  
  // Get the specific service by index
  const selectedService = laboratory?.laboratoryServices?.[parseInt(serviceIndex as string)] || null;

  // Mock scheduling data (in real app, this would come from API)
  const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const availableSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

  useEffect(() => {
    const loadLaboratory = async () => {
      try {
        setLoading(true);
        
        // First, try to find the laboratory in the existing store
        let foundLab = laboratories.find((lab: any) => lab._id === id);
        
        if (!foundLab && laboratories.length === 0) {
          // If not found and store is empty, search for laboratories
          await searchLaboratories();
          foundLab = laboratories.find((lab: any) => lab._id === id);
        }
        
        if (!foundLab) {
          // If still not found, create a mock laboratory with services for demo
          foundLab = {
            _id: id as string,
            laboratoryName: "MedLab Diagnostics",
            laboratoryPhone: "+91 98765 43210",
            laboratoryEmail: "info@medlabdiagnostics.com",
            laboratoryWebsite: "https://www.medlabdiagnostics.com",
            laboratoryAddress: {
              address: "123 Health Street, Medical District",
              city: "Mumbai",
              state: "Maharashtra", 
              country: "India",
              pinCode: "400001",
              googleMapsLink: "https://maps.google.com/?q=123+Health+Street+Mumbai"
            } as any,
            user: {
              name: "MedLab Diagnostics",
              phone: "+91 98765 43210",
              email: "contact@medlab.com",
              profilePicture: undefined
            },
            isAvailable: true,
            laboratoryServices: [
              {
                name: "Complete Blood Count (CBC)",
                category: "Blood Test",
                price: 500,
                collectionType: "both",
                rating: 4.8,
                description: "Complete blood count test to check overall health and detect various disorders",
                tests: [
                  { name: "White Blood Cell Count", description: "Measures the number of white blood cells" },
                  { name: "Red Blood Cell Count", description: "Measures the number of red blood cells" },
                  { name: "Hemoglobin Level", description: "Measures the amount of hemoglobin" },
                  { name: "Platelet Count", description: "Measures the number of platelets" }
                ]
              },
              {
                name: "Lipid Profile",
                category: "Blood Test", 
                price: 800,
                collectionType: "both",
                rating: 4.6,
                description: "Comprehensive cholesterol and lipid analysis",
                tests: [
                  { name: "Total Cholesterol", description: "Measures total cholesterol levels" },
                  { name: "HDL Cholesterol", description: "Good cholesterol measurement" },
                  { name: "LDL Cholesterol", description: "Bad cholesterol measurement" },
                  { name: "Triglycerides", description: "Measures triglyceride levels" }
                ]
              },
              {
                name: "Thyroid Function Test",
                category: "Hormone Test",
                price: 1200,
                collectionType: "both", 
                rating: 4.7,
                description: "Complete thyroid hormone analysis",
                tests: [
                  { name: "TSH", description: "Thyroid Stimulating Hormone" },
                  { name: "T3", description: "Triiodothyronine hormone" },
                  { name: "T4", description: "Thyroxine hormone" }
                ]
              },
              {
                name: "Urine Analysis",
                category: "Urine Test",
                price: 300,
                collectionType: "both",
                rating: 4.5,
                description: "Complete urine analysis for various health indicators",
                tests: [
                  { name: "Protein Level", description: "Checks protein in urine" },
                  { name: "Glucose Level", description: "Checks glucose in urine" },
                  { name: "Blood Cells", description: "Checks for blood cells in urine" }
                ]
              }
            ]
          } as any;
        }
        
        setLaboratory(foundLab);
      } catch (error) {
        console.error('Error loading laboratory:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadLaboratory();
    }
  }, [id, laboratories, searchLaboratories]);

  const handleSelectSlot = (day: string, time: string) => {
    if (time === '') {
      if (selectedDay !== day) {
        setSelectedSlot(null);
      }
      setSelectedDay(day);
    } else {
      setSelectedDay(day);
      setSelectedSlot(time);
    }
  };

  const handleSelectCollectionType = (type: 'lab' | 'home') => {
    setSelectedCollectionType(type);
  };

  const handleBookTest = async () => {
    if (selectedSlot && selectedDay && selectedCollectionType && selectedService) {
      try {
        setLoading(true);
        
        // Format time slot - handle both formats: "09:30" or "2:00 PM-3:00 PM"
        const formattedTimeSlot = `${selectedDay} ${selectedSlot}`;
        
        const bookingData = {
          labId: laboratory._id,
          timeSlot: formattedTimeSlot,
          collectionType: selectedCollectionType,
          serviceIndex: parseInt(serviceIndex as string)
        };

        const response = await apiClient.post('/api/v1/book-appointment-lab', bookingData);
        
        if (response.status === 201) {
          Alert.alert(
            'Booking Confirmed!',
            `Your ${selectedService.name} appointment has been booked successfully.\n\nLaboratory: ${laboratory?.laboratoryName}\nDate: ${selectedDay}\nTime: ${selectedSlot}\nCollection Type: ${selectedCollectionType === 'lab' ? 'Lab Visit' : 'Home Collection'}\nPrice: ₹${selectedService.price}\n\nYou will receive reminders 24 hours and 1 hour before your appointment.`,
            [
              {
                text: 'OK',
                onPress: () => router.push('/(tabs)/laboratories')
              }
            ]
          );
        }
      } catch (error: any) {
        console.error('Booking error:', error);
        Alert.alert(
          'Booking Failed',
          error.response?.data?.message || 'Failed to book appointment. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    } else {
      const missing = [];
      if (!selectedCollectionType) missing.push('collection type');
      if (!selectedDay) missing.push('day');
      if (!selectedSlot) missing.push('time slot');
      
      Alert.alert('Missing Information', `Please select: ${missing.join(', ')}`);
    }
  };

  const handleGoBack = () => {
    router.push('/(tabs)/laboratories');
  };

  // Check if all selections are made for button enabling
  const isBookingEnabled = !!(selectedSlot && selectedDay && selectedCollectionType);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!laboratory || !selectedService) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <FontAwesome name="exclamation-triangle" size={64} color="#9CA3AF" />
        <Text className="text-xl font-bold mt-4">Service not found</Text>
        <Text className="text-gray-600 mt-2">The selected laboratory service could not be found.</Text>
        <Pressable 
          onPress={handleGoBack}
          className="bg-primary px-6 py-3 rounded-lg mt-4"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
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
            {selectedService.coverImage ? (
              <Image
                source={{ uri: selectedService.coverImage }}
                resizeMode="stretch"
                className="w-full h-56"
              />
            ) : (
              <View className="w-full h-56 bg-gradient-to-r from-blue-400 to-blue-600 items-center justify-center">
                <FontAwesome name="flask" size={64} color="white" />
                <Text className="text-white mt-2 text-lg font-medium">Laboratory Service</Text>
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
            {/* Service Info Component - Main focus */}
            <ServiceInfo 
              service={selectedService} 
              laboratoryName={laboratory.laboratoryName}
            />
            
            {/* Collection Type Selection */}
            <View className="mt-6">
              <CollectionTypeSelector 
                selectedType={selectedCollectionType}
                onSelectType={handleSelectCollectionType}
              />
            </View>
            
            {/* Available Slots Section */}
            <View className="mt-6">
              <Text className="text-lg font-bold mb-3">Available Slots</Text>
              <Text className="text-gray-600 mb-3">
                Choose your preferred day and time for {selectedCollectionType === 'home' ? 'sample collection' : 'lab visit'}:
              </Text>
              <Slots 
                availableSlots={availableSlots} 
                availableDays={availableDays}
                onSelectSlot={handleSelectSlot}
                selectedDay={selectedDay}
                selectedSlot={selectedSlot}
              />
            </View>
            
            {/* Laboratory Address Information */}
            <View className="mt-6">
              <LaboratoryAddress laboratory={laboratory} />
            </View>
            
            {/* Selection Summary */}
            <View className="mt-6 bg-green-50 p-4 rounded-xl border border-green-200">
              <Text className="text-lg font-bold mb-3 text-green-900">Booking Summary</Text>
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <FontAwesome 
                    name="check-circle" 
                    size={16} 
                    color="#059669" 
                  />
                  <Text className="ml-2 text-green-700">
                    Service: {selectedService.name}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <FontAwesome 
                    name={selectedCollectionType ? "check-circle" : "circle-o"} 
                    size={16} 
                    color={selectedCollectionType ? "#059669" : "#9CA3AF"} 
                  />
                  <Text className={`ml-2 ${selectedCollectionType ? 'text-green-700' : 'text-gray-500'}`}>
                    Collection Type: {selectedCollectionType ? (selectedCollectionType === 'lab' ? 'Lab Visit' : 'Home Collection') : 'Not selected'}
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
                
                {/* Total Price */}
                <View className="border-t border-green-200 mt-3 pt-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-green-900 font-bold text-lg">Total Amount:</Text>
                    <Text className="text-green-900 font-bold text-xl">₹{selectedService.price}</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Space at the bottom for the floating button */}
            <View className="h-20" />
          </View>
        </SafeAreaView>
      </ScrollView>
      
      {/* Floating Book Test Button */}
      <Pressable 
        onPress={handleBookTest}
        disabled={!isBookingEnabled}
        className={`py-4 rounded-lg absolute bottom-6 left-6 right-6 shadow-lg ${
          isBookingEnabled ? 'bg-primary' : 'bg-gray-400'
        }`}
      >
        <Text className="text-white text-center font-bold text-lg">
          {isBookingEnabled ? `Book ${selectedService.name} - ₹${selectedService.price}` : 'Complete All Selections'}
        </Text>
      </Pressable>
    </View>
  );
}