import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';

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
  const [hasPermission, setHasPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const micScale = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      requestPermissions();
      initializeSpeechRecognition();
    }
  }, [visible]);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening]);

  const initializeSpeechRecognition = () => {
    if (Platform.OS === 'web') {
      // Web Speech Recognition API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setRecognizedText(finalTranscript || interimTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        setError('Speech recognition not supported in this browser');
      }
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        setError('Microphone permission is required for voice recognition');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setError('Failed to request microphone permission');
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  const startListening = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant microphone permission to use voice recognition.');
      return;
    }

    try {
      setError(null);
      setRecognizedText('');
      setIsListening(true);

      if (Platform.OS === 'web' && recognitionRef.current) {
        // Use Web Speech Recognition API
        recognitionRef.current.start();
      } else {
        // Use expo-av for mobile platforms
        await startMobileRecording();
      }

    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start voice recognition. Please try again.');
      setIsListening(false);
    }
  };

  const startMobileRecording = async () => {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (isListening) {
          stopListening();
        }
      }, 10000);

    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      stopPulseAnimation();

      if (Platform.OS === 'web' && recognitionRef.current) {
        // Stop Web Speech Recognition
        recognitionRef.current.stop();
      } else if (recordingRef.current) {
        // Stop mobile recording and process
        await stopMobileRecording();
      }
      
      // If we have recognized text, send it
      if (recognizedText.trim()) {
        onTextReceived(recognizedText.trim());
        onClose();
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setError('Failed to stop voice recognition.');
    }
  };

  const stopMobileRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsProcessing(true);
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      // Process the audio for speech-to-text
      await processMobileSpeechToText(uri);
      
    } catch (error) {
      console.error('Error processing recording:', error);
      setError('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processMobileSpeechToText = async (uri: string) => {
    try {
      // For now, we'll use a simple approach that works
      // In production, you would send this to a speech-to-text service
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll use a simple text input approach
      // This allows users to manually type what they said if speech-to-text isn't available
      setRecognizedText('Please type what you said or use the microphone again.');
      
      // In production, you would implement:
      // 1. Upload audio to your server
      // 2. Send to Google Speech-to-Text, Azure, or other service
      // 3. Return the transcribed text
      
    } catch (error) {
      console.error('Error processing speech to text:', error);
      setError('Failed to process speech. Please try again.');
    }
  };

  const handleTryAgain = () => {
    setRecognizedText('');
    setError(null);
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
      stopListening();
    }
    setRecognizedText('');
    setError(null);
    onClose();
  };

  const handleManualTextInput = () => {
    // Allow user to manually input text if speech recognition fails
    Alert.prompt(
      'Manual Text Input',
      'Please type what you said:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Use Text', 
          onPress: (text) => {
            if (text && text.trim()) {
              setRecognizedText(text.trim());
            }
          }
        }
      ],
      'plain-text'
    );
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
            <Text className="text-xl font-bold">Voice Recognition</Text>
            <Pressable onPress={handleClose} className="p-2">
              <FontAwesome name="times" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Status Display */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="text-center text-gray-600 mb-2">
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
            {Platform.OS === 'web' && (
              <Text className="text-xs text-blue-600 text-center mt-2">
                Using Web Speech Recognition API
              </Text>
            )}
            {Platform.OS !== 'web' && (
              <Text className="text-xs text-orange-600 text-center mt-2">
                Mobile: Audio recording with manual input option
              </Text>
            )}
          </View>

          {/* Recognized Text Display */}
          {recognizedText && (
            <View className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <Text className="text-sm text-gray-600 mb-2">Recognized Text:</Text>
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
                onPress={isListening ? stopListening : startListening}
                onPressIn={handleMicPressIn}
                onPressOut={handleMicPressOut}
                disabled={!hasPermission || isProcessing}
                className={`w-20 h-20 rounded-full items-center justify-center shadow-lg ${
                  !hasPermission 
                    ? 'bg-gray-400' 
                    : isListening 
                      ? 'bg-red-500' 
                      : isProcessing
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                }`}
                style={({ pressed }) => ({
                  shadowColor: !hasPermission ? '#9CA3AF' : isListening ? '#EF4444' : isProcessing ? '#F59E0B' : '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                  opacity: !hasPermission || isProcessing ? 0.6 : (pressed ? 0.8 : 1),
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
              disabled={!hasPermission || isProcessing}
              className="flex-1 bg-gray-100 py-4 rounded-lg flex-row justify-center items-center"
            >
              <FontAwesome name="refresh" size={16} color="#6B7280" />
              <Text className="text-gray-700 font-semibold ml-2">
                Try Again
              </Text>
            </Pressable>

            {Platform.OS !== 'web' && (
              <Pressable
                onPress={handleManualTextInput}
                disabled={isProcessing}
                className="flex-1 bg-green-500 py-4 rounded-lg flex-row justify-center items-center"
              >
                <FontAwesome name="keyboard-o" size={16} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Type Text
                </Text>
              </Pressable>
            )}

            {recognizedText && (
              <Pressable
                onPress={() => {
                  onTextReceived(recognizedText.trim());
                  onClose();
                }}
                className="flex-1 bg-blue-500 py-4 rounded-lg flex-row justify-center items-center"
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
              {Platform.OS === 'ios' 
                ? 'Voice recognition works best in a quiet environment'
                : 'Make sure to speak clearly and at a normal pace'
              }
            </Text>
            {Platform.OS !== 'web' && (
              <Text className="text-xs text-orange-500 text-center mt-2">
                On mobile: Use &quot;Type Text&quot; if speech recognition doesn&apos;t work
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default VoiceRecognitionModal; 