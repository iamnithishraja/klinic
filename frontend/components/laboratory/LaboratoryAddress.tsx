import { View, Text, Pressable, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface LaboratoryAddressProps {
  laboratory: {
    laboratoryName: string;
    laboratoryAddress?: {
      address: string;
      city: string;
      state: string;
      country: string;
      pinCode: string;
      googleMapsLink?: string;
    };
    laboratoryPhone?: string;
    laboratoryEmail?: string;
    laboratoryWebsite?: string;
    user?: {
      phone: string;
      email: string;
    };
  };
}

export default function LaboratoryAddress({ laboratory }: LaboratoryAddressProps) {
  const handleOpenMaps = () => {
    if (laboratory.laboratoryAddress?.googleMapsLink) {
      Linking.openURL(laboratory.laboratoryAddress.googleMapsLink);
    } else {
      // Fallback to Google Maps search with address
      const address = `${laboratory.laboratoryAddress?.address}, ${laboratory.laboratoryAddress?.city}`;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      Linking.openURL(mapsUrl);
    }
  };

  const handleCallLab = () => {
    const phone = laboratory.laboratoryPhone || laboratory.user?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleEmailLab = () => {
    const email = laboratory.laboratoryEmail || laboratory.user?.email;
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handleOpenWebsite = () => {
    if (laboratory.laboratoryWebsite) {
      Linking.openURL(laboratory.laboratoryWebsite);
    }
  };

  return (
    <View className="bg-gray-50 p-4 rounded-lg">
      <Text className="text-lg font-bold mb-3">Laboratory Information</Text>
      
      {/* Laboratory Name */}
      <View className="mb-4">
        <Text className="text-xl font-bold text-gray-900">{laboratory.laboratoryName}</Text>
        <Text className="text-gray-600 text-sm mt-1">Diagnostic & Testing Center</Text>
      </View>

      {/* Address with Google Maps Button */}
      {laboratory.laboratoryAddress && (
        <View className="mb-4">
          <View className="flex-row items-start mb-3">
            <FontAwesome name="map-marker" size={16} color="#4B5563" />
            <View className="ml-2 flex-1">
              <Text className="text-gray-800 font-medium">Address</Text>
              <Text className="text-gray-600">
                {laboratory.laboratoryAddress.address}
              </Text>
              <Text className="text-gray-600">
                {laboratory.laboratoryAddress.city}, {laboratory.laboratoryAddress.state} - {laboratory.laboratoryAddress.pinCode}
              </Text>
              <Text className="text-gray-600">
                {laboratory.laboratoryAddress.country}
              </Text>
            </View>
          </View>
          
          {/* Google Maps Button */}
          <Pressable 
            onPress={handleOpenMaps}
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center justify-center"
          >
            <FontAwesome name="map" size={16} color="white" />
            <Text className="text-white font-medium ml-2">Open in Google Maps</Text>
          </Pressable>
        </View>
      )}

      {/* Contact Information */}
      <View className="mb-4">
        <Text className="text-gray-800 font-bold mb-3">Contact Information</Text>
        <View className="space-y-3">
          {/* Lab Phone (priority) or User Phone */}
          {(laboratory.laboratoryPhone || laboratory.user?.phone) && (
            <Pressable 
              onPress={handleCallLab}
              className="flex-row items-center p-3 bg-green-50 rounded-lg border border-green-200"
            >
              <FontAwesome name="phone" size={16} color="#059669" />
              <View className="ml-3 flex-1">
                <Text className="text-green-800 font-medium">Phone</Text>
                <Text className="text-green-700">{laboratory.laboratoryPhone || laboratory.user?.phone}</Text>
              </View>
              <FontAwesome name="external-link" size={14} color="#059669" />
            </Pressable>
          )}
          
          {/* Lab Email (priority) or User Email */}
          {(laboratory.laboratoryEmail || laboratory.user?.email) && (
            <Pressable 
              onPress={handleEmailLab}
              className="flex-row items-center p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <FontAwesome name="envelope" size={16} color="#2563EB" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-800 font-medium">Email</Text>
                <Text className="text-blue-700">{laboratory.laboratoryEmail || laboratory.user?.email}</Text>
              </View>
              <FontAwesome name="external-link" size={14} color="#2563EB" />
            </Pressable>
          )}
          
          {/* Laboratory Website */}
          {laboratory.laboratoryWebsite && (
            <Pressable 
              onPress={handleOpenWebsite}
              className="flex-row items-center p-3 bg-purple-50 rounded-lg border border-purple-200"
            >
              <FontAwesome name="globe" size={16} color="#7C3AED" />
              <View className="ml-3 flex-1">
                <Text className="text-purple-800 font-medium">Website</Text>
                <Text className="text-purple-700" numberOfLines={1}>{laboratory.laboratoryWebsite}</Text>
              </View>
              <FontAwesome name="external-link" size={14} color="#7C3AED" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
} 