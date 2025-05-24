import { View } from 'react-native';
import DoctorList from '@/components/DoctorList';

export default function DoctorsScreen() {

  return (
    <View className="flex-1 bg-background">
      <DoctorList />
    </View>
  );
} 