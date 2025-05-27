import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Doctor } from '../services/doctorService';
import { FontAwesome } from '@expo/vector-icons';

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/doctors/${doctor._id}`);
  };

  const renderConsultationType = () => {
    if (doctor.consultationType === 'both') {
      return (
        <View className="flex-row flex-wrap">
          <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full mr-2">
            <FontAwesome name="hospital-o" size={12} color="#059669" />
            <Text className="text-green-700 text-xs ml-1">In-person</Text>
          </View>
          <View className="flex-row items-center bg-blue-100 px-2 py-1 rounded-full">
            <FontAwesome name="video-camera" size={12} color="#2563EB" />
            <Text className="text-blue-700 text-xs ml-1">Online</Text>
          </View>
        </View>
      );
    }
    
    const icon = doctor.consultationType === 'in-person' ? 'hospital-o' : 'video-camera';
    const color = doctor.consultationType === 'in-person' ? '#059669' : '#2563EB';
    const bgColor = doctor.consultationType === 'in-person' ? 'bg-green-100' : 'bg-blue-100';
    const textColor = doctor.consultationType === 'in-person' ? 'text-green-700' : 'text-blue-700';
    
    return (
      <View className={`flex-row items-center ${bgColor} px-2 py-1 rounded-full`}>
        <FontAwesome name={icon} size={12} color={color} />
        <Text className={`${textColor} text-xs ml-1 capitalize`}>{doctor.consultationType}</Text>
      </View>
    );
  };

  return (
    <Pressable onPress={handleViewDetails} className="bg-white mb-4 rounded-xl overflow-hidden shadow mx-4">
      {/* Cover Image Section */}
      {doctor.coverImage ? (
        <Image
          source={{ uri: doctor.coverImage }}
          className="w-full h-48"
          resizeMode="stretch"
        />
      ) : (
        <View className="w-full h-40 bg-gray-100 items-center justify-center">
          <FontAwesome name="user-md" size={48} color="#9CA3AF" />
        </View>
      )}

      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Dr. {doctor.user?.name || 'Unknown'}</Text>
            <Text className="text-sm text-gray-600 mt-1">{doctor.specializations?.join(', ')}</Text>
          </View>
          <View className="flex-row items-center bg-primary/10 px-2 py-1 rounded-full">
            <FontAwesome name="star" size={14} color="#FFD700" />
            <Text className="text-primary ml-1 font-semibold text-sm">{doctor.rating}/5</Text>
          </View>
        </View>

        {/* Description */}
        {doctor.description && (
          <Text className="text-gray-600 text-sm mt-2 leading-5" numberOfLines={2}>
            {doctor.description}
          </Text>
        )}

        {/* Professional Info */}
        <View className="mt-3 flex-row flex-wrap justify-between items-center">
          {/* Fee Card */}
          <View className="bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
            <Text className="text-xs text-gray-500 mb-1">Consultation Fee</Text>
            <View className="flex-row items-center">
              <FontAwesome name="money" size={14} color="#16a34a" />
              <Text className="text-primary font-bold text-base ml-2">₹{doctor.consultationFee}</Text>
            </View>
          </View>

          {/* Other Info */}
          <View className="flex-row items-center">
            <View className="flex-row items-center mr-4">
              <FontAwesome name="stethoscope" size={14} color="#4B5563" />
              <Text className="text-gray-600 text-sm ml-2">{doctor.experience} years exp.</Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="map-marker" size={14} color="#4B5563" />
              <Text className="text-gray-600 text-sm ml-2">{doctor.city}</Text>
            </View>
          </View>
        </View>

        {/* Consultation Type */}
        <View className="mt-3">
          {renderConsultationType()}
        </View>

        {/* Primary Clinic */}
        {doctor.clinics && doctor.clinics.length > 0 && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-xs text-gray-500">Primary Clinic</Text>
            <Text className="text-sm text-gray-700">{doctor.clinics[0].clinicName}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
} 