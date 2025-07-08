import { View, Text, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import RatingDisplay from '../RatingDisplay';
import { Doctor } from '@/services/doctorService';

interface DoctorInfoProps {
  doctor: Doctor;
}

export default function DoctorInfo({ doctor }: DoctorInfoProps) {
  const renderConsultationType = () => {
    if (doctor.consultationType === 'both') {
      return (
        <View className="flex-row flex-wrap">
          <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full mr-1 mb-1">
            <FontAwesome name="hospital-o" size={10} color="#059669" />
            <Text className="text-green-700 text-xs ml-1 font-medium">In-Person</Text>
          </View>
          <View className="flex-row items-center bg-blue-100 px-2 py-1 rounded-full mb-1">
            <FontAwesome name="video-camera" size={10} color="#2563EB" />
            <Text className="text-blue-700 text-xs ml-1 font-medium">Online</Text>
          </View>
        </View>
      );
    }
    
    const icon = doctor.consultationType === 'in-person' ? 'hospital-o' : 'video-camera';
    const color = doctor.consultationType === 'in-person' ? '#059669' : '#2563EB';
    const bgColor = doctor.consultationType === 'in-person' ? 'bg-green-100' : 'bg-blue-100';
    const textColor = doctor.consultationType === 'in-person' ? 'text-green-700' : 'text-blue-700';
    const displayText = doctor.consultationType === 'in-person' ? 'In-Person' : 'Online';
    
    return (
      <View className={`flex-row items-center ${bgColor} px-2 py-1 rounded-full self-start`}>
        <FontAwesome name={icon} size={10} color={color} />
        <Text className={`${textColor} text-xs ml-1 font-medium`}>{displayText}</Text>
      </View>
    );
  };

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
          <Text className="text-xl font-bold text-gray-900">Dr. {doctor.user?.name}</Text>
          <Text className="text-gray-600 text-base mt-1">{doctor.specializations?.join(', ')}</Text>
          <View className="flex-row items-center mt-2">
            <RatingDisplay 
              providerId={doctor._id} 
              type="doctor" 
              size="medium" 
            />
            {doctor.gender && (
              <>
                <Text className="text-gray-400 mx-2">•</Text>
                <FontAwesome 
                  name={doctor.gender === 'female' ? 'female' : 'male'} 
                  size={14} 
                  color="#6B7280" 
                />
                <Text className="text-gray-600 text-sm ml-1 capitalize">{doctor.gender}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Enhanced Quick Info Cards */}
      <View className="flex-row justify-between mt-6 space-x-3">
        {/* Experience Card */}
        <View className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <View className="flex-row items-center mb-2">
            <FontAwesome name="stethoscope" size={16} color="#2563EB" />
            <Text className="text-blue-800 font-medium ml-2">Experience</Text>
          </View>
          <Text className="text-blue-900 font-bold text-lg">{doctor.experience} Years</Text>
        </View>

        {/* Consultation Fee Card */}
        <View className="flex-1 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <View className="flex-row items-center mb-2">
            <FontAwesome name="money" size={16} color="#059669" />
            <Text className="text-green-800 font-medium ml-2">Consultation</Text>
          </View>
          <Text className="text-green-900 font-bold text-lg">₹{doctor.consultationFee}</Text>
        </View>

        {/* Consultation Type Card */}
        <View className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <View className="flex-row items-center mb-2">
            <FontAwesome name="handshake-o" size={16} color="#7C3AED" />
            <Text className="text-purple-800 font-medium ml-2">Available</Text>
          </View>
          <View className="mt-1">
            {renderConsultationType()}
          </View>
        </View>
      </View>

      {/* About Section */}
      {doctor.description && (
        <View className="mt-6 bg-gray-50 p-4 rounded-xl">
          <Text className="text-lg font-bold mb-3 text-gray-900">About Doctor</Text>
          <Text className="text-gray-700 leading-6">{doctor.description}</Text>
        </View>
      )}

      {/* Qualifications Section */}
      {doctor.qualifications && doctor.qualifications.length > 0 && (
        <View className="mt-6">
          <Text className="text-lg font-bold mb-3 text-gray-900">Qualifications</Text>
          <View className="bg-white p-4 rounded-xl border border-gray-200">
            {doctor.qualifications.map((qualification: string, index: number) => (
              <View key={index} className="flex-row items-center mb-2 last:mb-0">
                <FontAwesome name="graduation-cap" size={14} color="#6366F1" />
                <Text className="text-gray-700 ml-3 flex-1">{qualification}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Additional Information */}
      <View className="mt-6">
        <Text className="text-lg font-bold mb-3 text-gray-900">Additional Information</Text>
        <View className="bg-white p-4 rounded-xl border border-gray-200">
          <View className="flex-row flex-wrap">
            {doctor.languages && doctor.languages.length > 0 && (
              <View className="flex-row items-center mr-6 mb-3">
                <FontAwesome name="language" size={16} color="#6366F1" />
                <Text className="text-gray-700 ml-2 font-medium">Languages:</Text>
                <Text className="text-gray-600 ml-1">{doctor.languages.join(', ')}</Text>
              </View>
            )}
            {doctor.city && (
              <View className="flex-row items-center mb-3">
                <FontAwesome name="map-marker" size={16} color="#6366F1" />
                <Text className="text-gray-700 ml-2 font-medium">Location:</Text>
                <Text className="text-gray-600 ml-1">{doctor.city}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
