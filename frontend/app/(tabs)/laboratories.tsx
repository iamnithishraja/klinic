import { SafeAreaView, View } from 'react-native';
import LaboratoryList from '@/components/LaboratoryList';

export default function LaboratoriesScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <LaboratoryList />
      </SafeAreaView>
    </View>
  );
}