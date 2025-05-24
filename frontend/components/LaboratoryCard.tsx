import { View, Text, Image, Pressable } from 'react-native';
import { Laboratory } from '../services/laboratoryService';

interface LaboratoryCardProps {
  laboratory: Laboratory;
}

export default function LaboratoryCard({ laboratory }: LaboratoryCardProps) {
    return (
      <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <Text className="font-mono text-xs">
          {JSON.stringify(laboratory, null, 2)}
        </Text>
      </View>
  );
} 