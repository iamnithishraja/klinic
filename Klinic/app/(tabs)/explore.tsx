import { View, Text } from 'react-native';

export default function ExploreScreen() {
  return (
    <View className="flex-1 bg-background p-6 justify-center items-center">
      <View className="bg-surface rounded-xl p-6 shadow w-full border border-divider">
        <Text className="text-2xl font-roboto-bold text-primary mb-4 text-center">
          Explore Klinic
        </Text>
        <Text className="text-base font-opensans text-text-secondary text-center">
          This is the explore screen styled with NativeWind
        </Text>
      </View>
    </View>
  );
}