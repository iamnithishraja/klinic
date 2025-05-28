import { View, Text, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Doctor } from '@/services/doctorService';

interface DoctorInfoProps {
  doctor: Doctor;
}

export default function DoctorInfo({ doctor }: DoctorInfoProps) {
  return (
    <View>
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
          <Text className="font-bold capitalize">{doctor.consultationType}</Text>
        </View>
      </View>

      {/* About */}
      {doctor.description && (
        <View className="mt-4">
          <Text className="text-lg font-bold mb-2">About</Text>
          <Text className="text-gray-600">{doctor.description}</Text>
        </View>
      )}

      {/* Qualifications */}
      {doctor.qualifications && doctor.qualifications.length > 0 && (
        <View className="mt-4">
          <Text className="text-lg font-bold mb-2">Qualifications</Text>
          {doctor.qualifications.map((qualification: string, index: number) => (
            <Text key={index} className="text-gray-600">• {qualification}</Text>
          ))}
        </View>
      )}

      {/* Additional Details */}
      <View className="mt-4 flex-row flex-wrap">
        {doctor.gender && (
          <View className="flex-row items-center mr-4 mb-2">
            <FontAwesome 
              name={doctor.gender === 'female' ? 'female' : 'male'} 
              size={14} 
              color="#4B5563" 
            />
            <Text className="text-gray-600 text-sm ml-2 capitalize">{doctor.gender}</Text>
          </View>
        )}
        {doctor.languages && doctor.languages.length > 0 && (
          <View className="flex-row items-center mr-4 mb-2">
            <FontAwesome name="language" size={14} color="#4B5563" />
            <Text className="text-gray-600 text-sm ml-2">{doctor.languages.join(', ')}</Text>
          </View>
        )}
        {doctor.city && (
          <View className="flex-row items-center mb-2">
            <FontAwesome name="map-marker" size={14} color="#4B5563" />
            <Text className="text-gray-600 text-sm ml-2">{doctor.city}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
