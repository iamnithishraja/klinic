import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Doctor } from '../../../services/doctorService';
import { FontAwesome } from '@expo/vector-icons';

export default function DoctorDetails() {
  const { id } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch doctor details using the ID
    // This would typically be a call to your API
    setLoading(false);
  }, [id]);

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
    <ScrollView className="flex-1 bg-background">
      {/* Cover Image or Default Cover */}
      {doctor.coverImage ? (
        <Image
          source={{ uri: doctor.coverImage }}
          className="w-full h-48"
        />
      ) : (
        <View className="w-full h-48 bg-gray-100 items-center justify-center">
          <FontAwesome name="hospital-o" size={64} color="#9CA3AF" />
        </View>
      )}

      {/* Doctor Info */}
      <View className="bg-white p-4 -mt-6 rounded-t-3xl">
        <View className="flex-row items-center">
          {doctor.user?.profilePicture ? (
            <Image
              source={{ uri: doctor.user.profilePicture }}
              className="w-24 h-24 rounded-full border-4 border-white -mt-12"
            />
          ) : (
            <View className="w-24 h-24 rounded-full border-4 border-white -mt-12 bg-gray-100 items-center justify-center">
              <FontAwesome name="user-md" size={40} color="#9CA3AF" />
            </View>
          )}
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold">Dr. {doctor.user?.name}</Text>
            <Text className="text-gray-600">{doctor.specializations?.join(', ')}</Text>
            <View className="flex-row items-center mt-1">
              <FontAwesome name="star" size={16} color="#FFD700" />
              <Text className="text-gray-600 ml-1">{doctor.rating}/5</Text>
            </View>
          </View>
        </View>

        {/* Quick Info */}
        <View className="flex-row justify-between mt-4 bg-gray-50 p-4 rounded-lg">
          <View className="items-center">
            <Text className="text-gray-600">Experience</Text>
            <Text className="font-bold">{doctor.experience} Years</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-600">Consultation</Text>
            <Text className="font-bold">₹{doctor.consultationFee}</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-600">Type</Text>
            <Text className="font-bold">{doctor.consultationType}</Text>
          </View>
        </View>

        {/* About */}
        <View className="mt-4">
          <Text className="text-lg font-bold mb-2">About</Text>
          <Text className="text-gray-600">{doctor.description}</Text>
        </View>

        {/* Qualifications */}
        <View className="mt-4">
          <Text className="text-lg font-bold mb-2">Qualifications</Text>
          {doctor.qualifications?.map((qualification, index) => (
            <Text key={index} className="text-gray-600">• {qualification}</Text>
          ))}
        </View>

        {/* Clinics */}
        <View className="mt-4">
          <Text className="text-lg font-bold mb-2">Clinics</Text>
          {doctor.clinics?.map((clinic, index) => (
            <View key={index} className="bg-gray-50 p-4 rounded-lg mb-2">
              <Text className="font-bold">{clinic.clinicName}</Text>
              <Text className="text-gray-600">{clinic.clinicAddress?.address}</Text>
              <Text className="text-gray-600">Pin: {clinic.clinicAddress?.pinCode}</Text>
            </View>
          ))}
        </View>

        {/* Book Appointment Button */}
        <Pressable className="bg-primary py-4 rounded-lg mt-6">
          <Text className="text-white text-center font-bold text-lg">
            Book Appointment
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
} 