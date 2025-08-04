import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { VoiceInput } from './chat/VoiceInput';

const VoiceTest: React.FC = () => {
  const [result, setResult] = useState<string>('');

  const handleSend = (text: string) => {
    setResult(`Voice recognition successful! Text: "${text}"`);
  };

  return (
    <View style={{ padding: 20, flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Voice Recognition Test - {Platform.OS}
      </Text>
      
      <View style={{ 
        backgroundColor: '#f5f5f5', 
        padding: 15, 
        borderRadius: 8,
        minHeight: 100,
        marginBottom: 20
      }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Result:</Text>
        <Text>{result || 'No result yet. Try using the voice input below.'}</Text>
      </View>
      
      <View style={{ 
        backgroundColor: Platform.OS === 'web' ? '#e0f2fe' : '#f0fdf4', 
        padding: 15, 
        borderRadius: 8,
        marginBottom: 20
      }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
          Platform: {Platform.OS}
        </Text>
        <Text style={{ fontSize: 12 }}>
          {Platform.OS === 'web' 
            ? 'Web Speech API will be used for voice recognition'
            : 'Mobile-optimized voice recognition will be used'
          }
        </Text>
      </View>

      {/* Voice Input Component */}
      <View style={{ flex: 1 }}>
        <VoiceInput
          onSend={handleSend}
          placeholder="Test voice recognition here..."
          disabled={false}
        />
      </View>
    </View>
  );
};

export default VoiceTest; 