import { SafeAreaView, View } from 'react-native';
import LaboratoryList from '@/components/LaboratoryList';

export default function LaboratoriesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <LaboratoryList />
    </SafeAreaView>
  );
}