import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { voiceService } from '../../services/voiceService';

interface VoiceRecognitionModalProps {
  visible: boolean;
  onClose: () => void;
  onTextReceived: (text: string) => void;
}

const VoiceRecognitionModal: React.FC<VoiceRecognitionModalProps> = ({
  visible,
  onClose,
  onTextReceived,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const micScale = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if web speech is supported
  const isWebSpeechSupported = voiceService.isWebSpeechSupported();

  useEffect(() => {
    if (visible) {
      setError(null);
      setRecognizedText('');
      setRecordingDuration(0);
      
      if (!isWebSpeechSupported) {
        setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
    }
  }, [visible, isWebSpeechSupported]);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startDurationTimer();
    } else {
      stopPulseAnimation();
      stopDurationTimer();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  const startDurationTimer = () => {
    durationInterval.current = setInterval(() => {
      setRecordingDuration(voiceService.getRecordingDuration());
    }, 100);
  };

  const stopDurationTimer = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startListening = async () => {
    if (!isWebSpeechSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      setError(null);
      setRecognizedText('');
      setRecordingDuration(0);
      setIsListening(true);
      setIsProcessing(false);

      const success = await voiceService.startRecording();
      if (!success) {
        throw new Error('Failed to start speech recognition');
      }

    } catch (error: any) {
      console.error('Error starting speech recognition:', error);
      setError(error.message || 'Failed to start voice recognition. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      setIsProcessing(true);
      stopPulseAnimation();

      const result = await voiceService.stopRecording();
      
      if (result.success && result.text) {
        setRecognizedText(result.text);
        setIsProcessing(false);
        
        // Auto-close after a short delay to show the result
        setTimeout(() => {
          onTextReceived(result.text!);
          onClose();
        }, 1000);
      } else {
        setError(result.error || 'Speech recognition failed. Please try again.');
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Error stopping speech recognition:', error);
      setError('Failed to stop voice recognition.');
      setIsProcessing(false);
    }
  };

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleMicPressIn = () => {
    Animated.spring(micScale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handleMicPressOut = () => {
    Animated.spring(micScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    if (isListening) {
      voiceService.cancelRecording();
    }
    voiceService.cleanup();
    setRecognizedText('');
    setError(null);
    setRecordingDuration(0);
    onClose();
  };

  const handleTryAgain = () => {
    setRecognizedText('');
    setError(null);
    setRecordingDuration(0);
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-800">Voice Recognition</Text>
            <Pressable onPress={handleClose} className="p-2">
              <FontAwesome name="times" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Status Display */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="text-center text-gray-700 mb-2 font-medium">
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Ready to listen'}
            </Text>
            <Text className="text-xs text-gray-500 text-center">
              {isListening 
                ? 'Speak clearly into your microphone' 
                : isProcessing
                ? 'Converting speech to text...'
                : 'Tap the microphone to start recording'
              }
            </Text>
            {isListening && recordingDuration > 0 && (
              <Text className="text-xs text-blue-600 text-center mt-2 font-medium">
                Duration: {formatDuration(recordingDuration)}
              </Text>
            )}
          </View>

          {/* Recognized Text Display */}
          {recognizedText && (
            <View className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
              <Text className="text-sm text-gray-600 mb-2 font-medium">Recognized Text:</Text>
              <Text className="text-base text-gray-800 leading-6">
                {recognizedText}
              </Text>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
              <Text className="text-red-600 text-sm text-center">
                {error}
              </Text>
            </View>
          )}

          {/* Microphone Button */}
          <View className="items-center mb-6">
            <Animated.View
              style={{
                transform: [
                  { scale: micScale },
                  { scale: isListening ? pulseAnimation : 1 }
                ],
              }}
            >
              <Pressable
                onPress={handleMicPress}
                onPressIn={handleMicPressIn}
                onPressOut={handleMicPressOut}
                disabled={!isWebSpeechSupported || isProcessing}
                className={`w-20 h-20 rounded-full items-center justify-center shadow-lg ${
                  !isWebSpeechSupported 
                    ? 'bg-gray-400' 
                    : isListening 
                      ? 'bg-red-500' 
                      : isProcessing
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                }`}
                style={({ pressed }) => ({
                  shadowColor: !isWebSpeechSupported ? '#9CA3AF' : isListening ? '#EF4444' : isProcessing ? '#F59E0B' : '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                  opacity: !isWebSpeechSupported || isProcessing ? 0.6 : (pressed ? 0.8 : 1),
                })}
              >
                {isListening ? (
                  <ActivityIndicator color="white" size="large" />
                ) : isProcessing ? (
                  <FontAwesome name="cog" size={32} color="white" />
                ) : (
                  <FontAwesome 
                    name="microphone" 
                    size={32} 
                    color="white" 
                  />
                )}
              </Pressable>
            </Animated.View>
            
            <Text className="text-sm text-gray-600 mt-3 text-center">
              {isListening ? 'Tap to stop' : isProcessing ? 'Processing...' : 'Tap to start'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleTryAgain}
              disabled={!isWebSpeechSupported || isProcessing}
              className="flex-1 bg-gray-100 py-4 rounded-lg flex-row justify-center items-center"
            >
              <FontAwesome name="refresh" size={16} color="#6B7280" />
              <Text className="text-gray-700 font-semibold ml-2">
                Try Again
              </Text>
            </Pressable>

            {recognizedText && (
              <Pressable
                onPress={() => {
                  onTextReceived(recognizedText.trim());
                  onClose();
                }}
                className="flex-1 bg-green-500 py-4 rounded-lg flex-row justify-center items-center"
              >
                <FontAwesome name="check" size={16} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Use Text
                </Text>
              </Pressable>
            )}
          </View>

          {/* Instructions */}
          <View className="mt-4">
            <Text className="text-xs text-gray-500 text-center">
              Make sure to speak clearly and at a normal pace
            </Text>
            {!isWebSpeechSupported && (
              <Text className="text-xs text-red-500 text-center mt-2">
                Speech recognition requires Chrome, Edge, or Safari
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default VoiceRecognitionModal; 