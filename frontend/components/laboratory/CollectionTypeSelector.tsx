import { View, Text, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface CollectionTypeSelectorProps {
  selectedType?: 'lab' | 'home' | null;
  onSelectType: (type: 'lab' | 'home') => void;
}

export default function CollectionTypeSelector({ selectedType, onSelectType }: CollectionTypeSelectorProps) {
  const options = [
    { type: 'lab', label: 'Lab Visit', icon: 'building', description: 'Visit the laboratory' },
    { type: 'home', label: 'Home Collection', icon: 'home', description: 'Sample collected at home' }
  ];

  return (
    <View>
      <Text className="text-lg font-bold mb-3">Collection Type</Text>
      <Text className="text-gray-600 mb-3">
        Choose how you want your samples to be collected:
      </Text>
      <View className="flex-row flex-wrap">
        {options.map((option) => (
          <Pressable
            key={option.type}
            onPress={() => onSelectType(option.type as 'lab' | 'home')}
            className={`mr-3 mb-2 px-4 py-3 rounded-lg border flex-1 ${
              selectedType === option.type 
                ? 'bg-primary border-primary' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <View className="items-center">
              <FontAwesome 
                name={option.icon as any} 
                size={20} 
                color={selectedType === option.type ? 'white' : '#4B5563'} 
              />
              <Text className={`mt-2 font-medium text-center ${
                selectedType === option.type ? 'text-white' : 'text-gray-700'
              }`}>
                {option.label}
              </Text>
              <Text className={`text-xs text-center mt-1 ${
                selectedType === option.type ? 'text-white/80' : 'text-gray-500'
              }`}>
                {option.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
} 