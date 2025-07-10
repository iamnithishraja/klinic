import { View, Text, Image, Pressable } from 'react-native';
// @ts-ignore
import { useRouter } from 'expo-router';
import { Laboratory } from '../services/laboratoryService';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import RatingDisplay from './RatingDisplay';

interface LaboratoryCardProps {
  laboratory: Laboratory;
}

export default function LaboratoryCard({ laboratory }: LaboratoryCardProps) {
  const router = useRouter();
  
  // State to track selected tests for each service
  const [selectedTests, setSelectedTests] = useState<{ [serviceIndex: number]: { [testIndex: number]: boolean } }>({});

  const handleViewDetails = (serviceIndex: number, service: any) => {
    const selectedTestsForService = selectedTests[serviceIndex] || {};
    const selectedTestIndices = Object.keys(selectedTestsForService)
      .filter(testIndex => selectedTestsForService[parseInt(testIndex)])
      .map(testIndex => parseInt(testIndex));
    
    // Use serviceId if available (new approach), otherwise fall back to serviceIndex for backward compatibility
    const navigationParams = service._id 
      ? `serviceId=${service._id}` 
      : `serviceIndex=${serviceIndex}`;
    
    router.push(`/laboratories/${laboratory._id}?${navigationParams}&selectedTests=${selectedTestIndices.join(',')}`);
  };

  const toggleTestSelection = (serviceIndex: number, testIndex: number) => {
    setSelectedTests(prev => ({
      ...prev,
      [serviceIndex]: {
        ...prev[serviceIndex],
        [testIndex]: !prev[serviceIndex]?.[testIndex]
      }
    }));
  };

  const calculateServicePrice = (service: any, serviceIndex: number) => {
    if (!service.tests || service.tests.length === 0) {
      return service.price || 0;
    }
    
    // Check if all tests have individual prices
    const hasIndividualPricing = service.tests.every((test: any) => test.price && test.price > 0);
    
    if (!hasIndividualPricing) {
      // If no individual pricing, return service price (package price)
      return service.price || 0;
    }
    
    const selectedTestsForService = selectedTests[serviceIndex] || {};
    const hasAnySelection = Object.values(selectedTestsForService).some(selected => selected);
    
    if (!hasAnySelection) {
      // If no tests are selected, show full price (sum of all tests)
      return service.tests.reduce((sum: number, test: any) => sum + (test.price || 0), 0);
    }
    
    // Calculate price based on selected tests
    return service.tests.reduce((sum: number, test: any, index: number) => {
      return selectedTestsForService[index] ? sum + (test.price || 0) : sum;
    }, 0);
  };

  const hasIndividualTestPricing = (service: any) => {
    return service.tests && service.tests.length > 0 && 
           service.tests.every((test: any) => test.price && test.price > 0);
  };

  // Debug: Log all service IDs for this card
  if (laboratory.laboratoryServices) {
    laboratory.laboratoryServices.forEach(service => console.log('🟢 LaboratoryCard: service._id for RatingDisplay:', service._id));
  }

  // Handle case where laboratoryServices is undefined or empty
  if (!laboratory?.laboratoryServices || laboratory.laboratoryServices.length === 0) {
    return (
      <View className="mb-4 mx-4 mt-4">
        <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <View className="items-center">
            <FontAwesome name="flask" size={48} color="#9CA3AF" />
            <Text className="text-lg font-bold text-gray-900 mt-4">{laboratory?.laboratoryName || 'Laboratory'}</Text>
            <Text className="text-gray-600 text-center mt-2">
              No services available at this time
            </Text>
            <View className="mt-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-800 text-sm text-center">
                This laboratory is currently updating their service offerings. Please check back later.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-4 mx-4 mt-4">
      {/* Services Cards */}
      {laboratory.laboratoryServices.map((service, index) => (
        <Pressable
          key={index}
          onPress={() => handleViewDetails(index, service)}
          className="bg-white rounded-xl overflow-hidden shadow-lg mb-6 border border-gray-100"
        >
          {/* Service Cover Image */}
          {service.coverImage ? (
            <Image
              source={{ uri: service.coverImage }}
              className="w-full h-40"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-40 bg-gray-100 items-center justify-center">
              <FontAwesome name="flask" size={40} color="#9CA3AF" />
            </View>
          )}

          <View className="p-4">
            {/* Laboratory Info */}
            <View className="mb-3 pb-3 border-b border-gray-100">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900">{laboratory.laboratoryName}</Text>
                  <View className="flex-row flex-wrap mt-2">
                    <View className="flex-row items-center mr-4">
                      <FontAwesome name="phone" size={14} color="#4B5563" />
                      <Text className="text-gray-600 text-sm ml-2">{laboratory.user?.phone}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <FontAwesome name="map-marker" size={14} color="#4B5563" />
                      <Text className="text-gray-600 text-sm ml-2">
                        {laboratory.laboratoryAddress?.address || 'Address not available'}, {laboratory.laboratoryAddress?.pinCode || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row items-center bg-primary/10 px-2 py-1 rounded-full">
                  <RatingDisplay 
                    providerId={(service as any)?.laboratoryServiceId ? String((service as any).laboratoryServiceId) : (service._id ? String(service._id) : '')} // Use laboratoryServiceId if present
                    providerType="laboratoryService" 
                    size="small" 
                  />
                </View>
              </View>
            </View>

            {/* Service Header */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">{service.name}</Text>
                <Text className="text-base text-gray-600 mt-1">{service.category}</Text>
              </View>
              <View className="bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
                <Text className="text-xs text-gray-500 mb-1">
                  {hasIndividualTestPricing(service) ? 'Selected Tests' : 'Package Fee'}
                </Text>
                <Text className="text-primary font-bold text-lg">₹{calculateServicePrice(service, index)}</Text>
                {hasIndividualTestPricing(service) && (
                  <Text className="text-xs text-gray-500 mt-1">
                    {Object.values(selectedTests[index] || {}).filter(selected => selected).length || service.tests?.length || 0} tests
                  </Text>
                )}
              </View>
            </View>

            {/* Service Description */}
            {service.description && (
              <Text className="text-gray-600 mt-3 text-sm" numberOfLines={2}>
                {service.description}
              </Text>
            )}

            {/* Collection Type */}
            <View className="flex-row items-center mt-3">
              <View className={`flex-row items-center px-3 py-1.5 rounded-full ${
                service.collectionType === 'home' ? 'bg-green-100' :
                service.collectionType === 'lab' ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
                <FontAwesome 
                  name={service.collectionType === 'lab' ? 'hospital-o' : 'home'} 
                  size={14} 
                  color={
                    service.collectionType === 'home' ? '#059669' :
                    service.collectionType === 'lab' ? '#2563EB' : '#7C3AED'
                  } 
                />
                <Text className={`ml-2 text-sm ${
                  service.collectionType === 'home' ? 'text-green-700' :
                  service.collectionType === 'lab' ? 'text-blue-700' : 'text-purple-700'
                }`}>
                  {service.collectionType === 'both' 
                    ? 'Home & Lab' 
                    : service.collectionType === 'home' 
                      ? 'Home Collection' 
                      : 'Lab Visit'}
                </Text>
              </View>
            </View>

            {/* Tests Section with Selection */}
            {service.tests && service.tests.length > 0 && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  {hasIndividualTestPricing(service) ? `Available Tests (${service.tests.length}):` : `Included Tests (${service.tests.length}):`}
                </Text>
                {hasIndividualTestPricing(service) ? (
                  <Text className="text-xs text-gray-500 mb-3">
                    Tap tests to include/exclude from your package
                  </Text>
                ) : (
                  <Text className="text-xs text-gray-500 mb-3">
                    All tests included in package price
                  </Text>
                )}
                {service.tests.slice(0, 3).map((test, testIndex) => {
                  const isSelected = hasIndividualTestPricing(service) 
                    ? (selectedTests[index]?.[testIndex] !== false) // Default to true for individual pricing
                    : true; // Always selected for package pricing
                  
                  const TestComponent = hasIndividualTestPricing(service) ? Pressable : View;
                  
                  return (
                    <TestComponent 
                      key={testIndex} 
                      onPress={hasIndividualTestPricing(service) ? () => toggleTestSelection(index, testIndex) : undefined}
                      className={`mb-2 p-3 rounded-lg border ${
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
                              size={16} 
                              color={isSelected ? "#059669" : "#9CA3AF"} 
                            />
                            <Text className={`ml-2 text-sm font-medium ${
                              isSelected ? 'text-gray-800' : 'text-gray-500'
                            }`}>
                              {test.name}
                            </Text>
                          </View>
                          {test.description && (
                            <Text className={`text-xs mt-1 ml-6 ${
                              isSelected ? 'text-gray-600' : 'text-gray-400'
                            }`} numberOfLines={2}>
                              {test.description}
                            </Text>
                          )}
                        </View>
                        {hasIndividualTestPricing(service) && (
                          <Text className={`text-sm font-semibold ${
                            isSelected ? 'text-green-700' : 'text-gray-400'
                          }`}>
                            ₹{test.price || 0}
                          </Text>
                        )}
                      </View>
                    </TestComponent>
                  );
                })}
                {service.tests.length > 3 && (
                  <Text className="text-xs text-primary mt-2">
                    +{service.tests.length - 3} more tests (view details to see all)
                  </Text>
                )}
              </View>
            )}

            {/* Book Now Button */}
            <View className="mt-4 flex-row justify-end">
              <Pressable 
                onPress={() => handleViewDetails(index, service)}
                className="bg-primary px-4 py-2.5 rounded-lg flex-row items-center"
              >
                <Text className="text-white font-semibold mr-2">
                  Book Now - ₹{calculateServicePrice(service, index)}
                </Text>
                <FontAwesome name="arrow-right" size={14} color="white" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
} 