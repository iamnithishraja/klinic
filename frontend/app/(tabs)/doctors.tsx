import { View } from 'react-native';
import DoctorList from '@/components/DoctorList';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DoctorsScreen() {

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <DoctorList />
      </SafeAreaView>
    </View>
  );
} 