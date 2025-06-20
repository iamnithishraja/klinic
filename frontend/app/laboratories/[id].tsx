import { View, Text, Image, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { useLaboratoryStore } from '@/store/laboratoryStore';
// @ts-ignore
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient from '@/api/client';
import { useCustomAlert } from '@/components/CustomAlert';

// Import separated components
import ServiceInfo from '@/components/laboratory/ServiceInfo';
import CollectionTypeSelector from '@/components/laboratory/CollectionTypeSelector';
import Slots from '@/components/laboratory/Slots';
import LaboratoryAddress from '@/components/laboratory/LaboratoryAddress';
import PaymentModal from '@/components/PaymentModal';

export default function LaboratoryServiceDetails() {
  const { id, serviceIndex, selectedTests: selectedTestsParam } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [laboratory, setLaboratory] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedCollectionType, setSelectedCollectionType] = useState<'lab' | 'home' | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookedAppointmentId, setBookedAppointmentId] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<{ [testIndex: number]: boolean }>({});
  const { showAlert, AlertComponent } = useCustomAlert();
  
  // Get laboratories from the Zustand store
  const { laboratories, searchLaboratories } = useLaboratoryStore();
  
  // Get the specific service by index
  const selectedService = laboratory?.laboratoryServices?.[parseInt(serviceIndex as string)] || null;

  // Mock scheduling data (in real app, this would come from API)
  const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const availableSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

  // Initialize selected tests from URL parameter
  useEffect(() => {
    if (selectedService?.tests) {
      const initialSelection: { [testIndex: number]: boolean } = {};
      
      if (hasIndividualTestPricing()) {
        // Only allow selection if individual pricing is available
        if (selectedTestsParam) {
          const testIndices = (selectedTestsParam as string).split(',').map(index => parseInt(index)).filter(index => !isNaN(index));
          
          if (testIndices.length > 0) {
            // If specific tests are selected from URL, use only those
            testIndices.forEach(index => {
              if (index >= 0 && index < selectedService.tests.length) {
                initialSelection[index] = true;
              }
            });
          } else {
            // Default to all tests selected
            selectedService.tests.forEach((_, index) => {
              initialSelection[index] = true;
            });
          }
        } else {
          // Default to all tests selected
          selectedService.tests.forEach((_, index) => {
            initialSelection[index] = true;
          });
        }
      } else {
        // For package pricing, all tests are always selected
        selectedService.tests.forEach((_, index) => {
          initialSelection[index] = true;
        });
      }
      
      setSelectedTests(initialSelection);
    }
  }, [selectedTestsParam, selectedService]);

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
                  { name: "White Blood Cell Count", description: "Measures the number of white blood cells", price: 150 },
                  { name: "Red Blood Cell Count", description: "Measures the number of red blood cells", price: 120 },
                  { name: "Hemoglobin Level", description: "Measures the amount of hemoglobin", price: 100 },
                  { name: "Platelet Count", description: "Measures the number of platelets", price: 130 }
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
                  { name: "Total Cholesterol", description: "Measures total cholesterol levels", price: 200 },
                  { name: "HDL Cholesterol", description: "Good cholesterol measurement", price: 180 },
                  { name: "LDL Cholesterol", description: "Bad cholesterol measurement", price: 180 },
                  { name: "Triglycerides", description: "Measures triglyceride levels", price: 240 }
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
                  { name: "TSH", description: "Thyroid Stimulating Hormone", price: 300 },
                  { name: "T3", description: "Triiodothyronine hormone", price: 400 },
                  { name: "T4", description: "Thyroxine hormone", price: 500 }
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
                  { name: "Protein Level", description: "Checks protein in urine", price: 80 },
                  { name: "Glucose Level", description: "Checks glucose in urine", price: 70 },
                  { name: "Blood Cells", description: "Checks for blood cells in urine", price: 150 }
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

  const toggleTestSelection = (testIndex: number) => {
    setSelectedTests(prev => ({
      ...prev,
      [testIndex]: !prev[testIndex]
    }));
  };

  const calculateTotalPrice = () => {
    if (!selectedService?.tests || selectedService.tests.length === 0) {
      return selectedService?.price || 0;
    }
    
    // Check if all tests have individual prices
    const hasIndividualPricing = selectedService.tests.every((test: any) => test.price && test.price > 0);
    
    if (!hasIndividualPricing) {
      // If no individual pricing, return service price (package price)
      return selectedService?.price || 0;
    }
    
    return selectedService.tests.reduce((sum: number, test: any, index: number) => {
      return selectedTests[index] ? sum + (test.price || 0) : sum;
    }, 0);
  };

  const hasIndividualTestPricing = () => {
    return selectedService?.tests && selectedService.tests.length > 0 && 
           selectedService.tests.every((test: any) => test.price && test.price > 0);
  };

  const getSelectedTestsCount = () => {
    return Object.values(selectedTests).filter(selected => selected).length;
  };

  const handleBookTest = async () => {
    if (selectedSlot && selectedDay && selectedCollectionType && selectedService) {
      try {
        setLoading(true);
        
        // Format time slot - handle both formats: "09:30" or "2:00 PM-3:00 PM"
        const formattedTimeSlot = `${selectedDay} ${selectedSlot}`;
        
        const selectedTestIndices = Object.keys(selectedTests)
          .filter(testIndex => selectedTests[parseInt(testIndex)])
          .map(testIndex => parseInt(testIndex));

        const bookingData = {
          labId: laboratory._id,
          timeSlot: formattedTimeSlot,
          collectionType: selectedCollectionType,
          serviceIndex: parseInt(serviceIndex as string),
          selectedTests: selectedTestIndices
        };

        const response = await apiClient.post('/api/v1/book-appointment-lab', bookingData);
        
        if (response.status === 201) {
          const appointmentId = response.data._id;
          setBookedAppointmentId(appointmentId);
          
          // Show payment modal
          setShowPaymentModal(true);
        }
      } catch (error: any) {
        console.error('Booking error:', error);
        showAlert({
          title: 'Booking Failed',
          message: error.response?.data?.message || 'Failed to book appointment. Please try again.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    } else {
      const missing = [];
      if (!selectedCollectionType) missing.push('collection type');
      if (!selectedDay) missing.push('day');
      if (!selectedSlot) missing.push('time slot');
      
      showAlert({
        title: 'Missing Information',
        message: `Please select: ${missing.join(', ')}`,
        type: 'warning'
      });
    }
  };

  const handleGoBack = () => {
    router.push('/(tabs)/laboratories');
  };

  const handlePaymentSuccess = () => {
    showAlert({
      title: 'Booking Confirmed!',
      message: `Your ${selectedService?.name} appointment has been booked successfully.\n\nLaboratory: ${laboratory?.laboratoryName}\nDate: ${selectedDay}\nTime: ${selectedSlot}\nCollection Type: ${selectedCollectionType === 'lab' ? 'Lab Visit' : 'Home Collection'}\nSelected Tests: ${getSelectedTestsCount()}/${selectedService?.tests?.length || 0}\nTotal Price: ₹${calculateTotalPrice()}\n\nYou will receive reminders 24 hours and 1 hour before your appointment.`,
      type: 'success',
      buttons: [
        {
          text: 'OK',
          style: 'primary',
          onPress: () => router.push('/')
        }
      ]
    });
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
            
            {/* Test Selection Section */}
            {selectedService?.tests && selectedService.tests.length > 0 && (
              <View className="mt-6">
                <Text className="text-lg font-bold mb-3">
                  {hasIndividualTestPricing() ? 'Select Tests' : 'Included Tests'}
                </Text>
                <Text className="text-gray-600 mb-3">
                  {hasIndividualTestPricing() 
                    ? 'Choose which tests to include in your package:'
                    : 'All tests included in package price:'
                  }
                </Text>
                {selectedService.tests.map((test, testIndex) => {
                  const isSelected = selectedTests[testIndex];
                  const TestComponent = hasIndividualTestPricing() ? Pressable : View;
                  
                  return (
                    <TestComponent 
                      key={testIndex} 
                      onPress={hasIndividualTestPricing() ? () => toggleTestSelection(testIndex) : undefined}
                      className={`mb-3 p-4 rounded-xl border ${
                        isSelected 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <FontAwesome 
                              name={isSelected ? "check-circle" : "circle-o"} 
                              size={18} 
                              color={isSelected ? "#059669" : "#9CA3AF"} 
                            />
                            <Text className={`ml-3 text-base font-medium ${
                              isSelected ? 'text-gray-800' : 'text-gray-500'
                            }`}>
                              {test.name}
                            </Text>
                          </View>
                          {test.description && (
                            <Text className={`text-sm mt-2 ml-7 ${
                              isSelected ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                              {test.description}
                            </Text>
                          )}
                        </View>
                        {hasIndividualTestPricing() && (
                          <Text className={`text-base font-bold ${
                            isSelected ? 'text-green-700' : 'text-gray-400'
                          }`}>
                            ₹{test.price || 0}
                          </Text>
                        )}
                      </View>
                    </TestComponent>
                  );
                })}
                
                {!hasIndividualTestPricing() && (
                  <View className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-blue-800 font-medium text-center">
                      Package Price: ₹{selectedService?.price || 0}
                    </Text>
                    <Text className="text-blue-600 text-sm text-center mt-1">
                      All {selectedService.tests.length} tests included
                    </Text>
                  </View>
                )}
              </View>
            )}

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
                
                {/* Selected Tests */}
                {selectedService?.tests && selectedService.tests.length > 0 && (
                  <View className="flex-row items-center">
                    <FontAwesome 
                      name={getSelectedTestsCount() > 0 ? "check-circle" : "circle-o"} 
                      size={16} 
                      color={getSelectedTestsCount() > 0 ? "#059669" : "#9CA3AF"} 
                    />
                    <Text className={`ml-2 ${getSelectedTestsCount() > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                      Tests Selected: {getSelectedTestsCount()}/{selectedService.tests.length}
                    </Text>
                  </View>
                )}
                
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
                    <Text className="text-green-900 font-bold text-xl">₹{calculateTotalPrice()}</Text>
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
        disabled={!isBookingEnabled || (hasIndividualTestPricing() && getSelectedTestsCount() === 0)}
        className={`py-4 rounded-lg absolute bottom-6 left-6 right-6 shadow-lg ${
          isBookingEnabled && (!hasIndividualTestPricing() || getSelectedTestsCount() > 0) ? 'bg-primary' : 'bg-gray-400'
        }`}
      >
        <Text className="text-white text-center font-bold text-lg">
          {hasIndividualTestPricing() && getSelectedTestsCount() === 0 
            ? 'Select at least one test' 
            : isBookingEnabled 
              ? `Book ${selectedService.name} - ₹${calculateTotalPrice()}` 
              : 'Complete All Selections'}
        </Text>
      </Pressable>
      
      {/* Payment Modal */}
      {showPaymentModal && bookedAppointmentId && selectedService && (
        <PaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          appointmentData={{
            appointmentId: bookedAppointmentId,
            appointmentType: 'lab',
            amount: calculateTotalPrice(),
            collectionType: selectedCollectionType || '',
            serviceName: selectedService.name,
            laboratoryName: laboratory?.laboratoryName || 'Laboratory'
          }}
          isOnlineRequired={false} // Lab appointments are never required to pay online
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      
      {/* Custom Alert Component */}
      <AlertComponent />
    </View>
  );
}