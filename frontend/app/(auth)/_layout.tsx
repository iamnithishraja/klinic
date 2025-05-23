import { Slot } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthLayout() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        <Slot />
      </View>
    </SafeAreaView>
  );
} 