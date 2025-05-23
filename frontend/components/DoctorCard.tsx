import { View, Text } from 'react-native';

interface DoctorCardProps {
  doctor: any; // We'll type this properly later
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <Text className="font-mono text-xs">
        {JSON.stringify(doctor, null, 2)}
      </Text>
    </View>
  );
} 