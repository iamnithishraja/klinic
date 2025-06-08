import { View, Text, Pressable, Linking } from 'react-native';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

interface Clinic {
  clinicName: string;
  clinicAddress: {
    address?: string;
    city?: string;
    state?: string;
    pinCode: string;
    country?: string;
    googleMapsLink?: string;
    latitude?: number;
    longitude?: number;
  };
  clinicPhone?: string;
  clinicEmail?: string;
  clinicWebsite?: string;
}

interface AddressesProps {
  clinics: Clinic[];
  onSelectClinic?: (clinic: Clinic) => void;
  disabled?: boolean;
}

export default function Addresses({ clinics, onSelectClinic, disabled = false }: AddressesProps) {
  const [selectedClinicIndex, setSelectedClinicIndex] = useState<number | null>(null);

  if (!clinics || clinics.length === 0) {
    return (
      <View className="bg-gray-50 p-4 rounded-lg">
        <Text className="text-gray-600 text-center">No clinic addresses available</Text>
      </View>
    );
  }

  const handleSelectClinic = (index: number) => {
    if (disabled) return; // Don't allow selection if disabled
    
    setSelectedClinicIndex(index);
    if (onSelectClinic) {
      onSelectClinic(clinics[index]);
    }
  };

  return (
    <View>
      {clinics.map((clinic, index) => (
        <Pressable
          key={index}
          onPress={() => handleSelectClinic(index)}
          disabled={disabled}
          className={`p-4 rounded-lg mb-2 border ${
            disabled 
              ? 'bg-gray-100 border-gray-200' 
              : selectedClinicIndex === index 
                ? 'bg-gray-50 border-primary' 
                : 'bg-gray-50 border-transparent'
          }`}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-bold text-gray-900">{clinic.clinicName}</Text>
              <Text className="text-gray-600 mt-1">
                {clinic.clinicAddress?.address || 'Address not available'}
              </Text>
              <Text className="text-gray-600">
                {[
                  clinic.clinicAddress?.city,
                  clinic.clinicAddress?.state,
                  clinic.clinicAddress?.pinCode
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
              
              {/* Contact Information */}
              {(clinic.clinicPhone || clinic.clinicEmail) && (
                <View className="mt-2">
                  {clinic.clinicPhone && (
                    <View className="flex-row items-center">
                      <FontAwesome name="phone" size={14} color="#4B5563" />
                      <Text className="text-gray-600 ml-2">{clinic.clinicPhone}</Text>
                    </View>
                  )}
                  {clinic.clinicEmail && (
                    <View className="flex-row items-center mt-1">
                      <FontAwesome name="envelope" size={14} color="#4B5563" />
                      <Text className="text-gray-600 ml-2">{clinic.clinicEmail}</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Google Maps Navigation Button */}
              {(clinic.clinicAddress?.googleMapsLink || 
                (clinic.clinicAddress?.latitude && clinic.clinicAddress?.longitude)) && (
                <Pressable 
                  onPress={() => {
                    // Open Google Maps with the clinic location
                    const mapsUrl = clinic.clinicAddress?.googleMapsLink || 
                      `https://maps.google.com/?q=${clinic.clinicAddress?.latitude},${clinic.clinicAddress?.longitude}`;
                    Linking.openURL(mapsUrl);
                  }}
                  className="mt-3 bg-blue-500 py-2 px-3 rounded-lg flex-row items-center justify-center">
                  <FontAwesome name="map-marker" size={14} color="white" />
                  <Text className="text-white ml-2 font-medium">Navigate</Text>
                </Pressable>
              )}
            </View>
            
            {selectedClinicIndex === index && (
              <View className="bg-primary rounded-full p-2">
                <FontAwesome name="check" size={12} color="white" />
              </View>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
