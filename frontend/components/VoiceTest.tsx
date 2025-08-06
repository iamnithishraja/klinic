import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { voiceService } from '@/services/voiceService';

const VoiceTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<string>('');

  const testVoiceRecognition = async () => {
    try {
      setIsRecording(true);
      setResult(`Starting recording on ${Platform.OS}...`);
      
      const success = await voiceService.startRecording();
      if (!success) {
        setResult('Failed to start recording');
        return;
      }
      
      setResult(`Recording on ${Platform.OS}... Speak now!`);
      
      // Stop after 5 seconds
      setTimeout(async () => {
        const recordingResult = await voiceService.stopRecording();
        setIsRecording(false);
        
        if (recordingResult.success) {
          setResult(`Success! Text: "${recordingResult.text}"`);
        } else {
          setResult(`Error: ${recordingResult.error}`);
        }
      }, 5000);
      
    } catch (error: any) {
      setIsRecording(false);
      setResult(`Error: ${error.message}`);
    }
  };

  const cancelRecording = async () => {
    await voiceService.cancelRecording();
    setIsRecording(false);
    setResult('Recording cancelled');
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Voice Recognition Test - {Platform.OS}
      </Text>
      
      <TouchableOpacity
        onPress={isRecording ? cancelRecording : testVoiceRecognition}
        style={{
          backgroundColor: isRecording ? '#ff4444' : Platform.OS === 'web' ? '#4F46E5' : '#10B981',
          padding: 15,
          borderRadius: 8,
          marginBottom: 20
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {isRecording ? 'Cancel Recording' : `Start Voice Test (${Platform.OS})`}
        </Text>
      </TouchableOpacity>
      
      <View style={{ 
        backgroundColor: '#f5f5f5', 
        padding: 15, 
        borderRadius: 8,
        minHeight: 100
      }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Result:</Text>
        <Text>{result || 'No result yet'}</Text>
      </View>
      
      <View style={{ 
        backgroundColor: Platform.OS === 'web' ? '#e0f2fe' : '#f0fdf4', 
        padding: 15, 
        borderRadius: 8,
        marginTop: 20
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
    </View>
  );
};

export default VoiceTest; 