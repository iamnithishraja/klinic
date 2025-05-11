import { View, Text, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        <Text className="text-3xl font-roboto-bold text-primary mb-4">Welcome to Klinic</Text>
        <Text className="text-lg font-opensans text-text-primary mb-6">
          This app is styled with NativeWind using custom theme colors.
        </Text>
        
        {/* Color showcase */}
        <View className="mb-8">
          <Text className="text-xl font-roboto-bold text-text-primary mb-4">Theme Colors</Text>
          
          <View className="mb-4 rounded-lg bg-primary p-4">
            <Text className="text-white font-opensans">Primary</Text>
          </View>
          
          <View className="mb-4 rounded-lg bg-secondary p-4">
            <Text className="text-text-primary font-opensans">Secondary</Text>
          </View>
          
          <View className="mb-4 rounded-lg bg-accent p-4">
            <Text className="text-white font-opensans">Accent</Text>
          </View>
          
          <View className="mb-4 rounded-lg bg-success p-4">
            <Text className="text-white font-opensans">Success</Text>
          </View>
          
          <View className="mb-4 rounded-lg bg-warning p-4">
            <Text className="text-text-primary font-opensans">Warning</Text>
          </View>
          
          <View className="mb-4 rounded-lg bg-surface p-4 border border-divider">
            <Text className="text-text-primary font-opensans">Surface</Text>
          </View>
        </View>
        
        {/* Typography showcase */}
        <View>
          <Text className="text-xl font-roboto-bold text-text-primary mb-4">Typography</Text>
          
          <Text className="text-2xl font-roboto text-text-primary mb-2">Roboto Regular</Text>
          <Text className="text-2xl font-roboto-bold text-text-primary mb-4">Roboto Bold</Text>
          
          <Text className="text-2xl font-opensans text-text-primary mb-2">OpenSans Regular</Text>
          <Text className="text-2xl font-opensans-bold text-text-primary mb-4">OpenSans Bold</Text>
        </View>
      </View>
    </ScrollView>
  );
}
