import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { voiceService, VoiceRecordingResult } from '@/services/voiceService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VoiceRecordingModalProps {
  visible: boolean;
  onClose: () => void;
  onTextReceived: (text: string) => void;
}

export const VoiceRecordingModal: React.FC<VoiceRecordingModalProps> = ({
  visible,
  onClose,
  onTextReceived,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realTimeText, setRealTimeText] = useState<string>('');
  const [isWebSpeechAvailable, setIsWebSpeechAvailable] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  // Check if Web Speech API is available
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      setIsWebSpeechAvailable(!!SpeechRecognition);
    }
  }, []);

  // Start recording when modal opens
  useEffect(() => {
    if (visible) {
      setRetryCount(0);
      setError(null);
      startRecording();
    } else {
      stopRecording();
    }
  }, [visible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      voiceService.cleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setIsSuccess(false);
      setRealTimeText('');
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingDuration(0);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
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

      // Start scale animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start recording
      const success = await voiceService.startRecording();
      if (!success) {
        throw new Error('Failed to start recording. Please check microphone permissions.');
      }

      // Start duration timer
      durationInterval.current = setInterval(() => {
        if (isRecordingRef.current) {
          setRecordingDuration(voiceService.getRecordingDuration());
        }
      }, 100);

      // Start real-time speech recognition for web
      if (Platform.OS === 'web' && isWebSpeechAvailable) {
        startRealTimeSpeechRecognition();
      }

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (isRecordingRef.current) {
          stopRecording();
        }
      }, 5000);

    } catch (error: any) {
      console.error('Error starting recording:', error);
      setError(error.message || 'Failed to start recording. Please check microphone permissions.');
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const startRealTimeSpeechRecognition = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (!event.results[i].isFinal) {
              interimTranscript += transcript;
            } else {
              finalTranscript += transcript;
            }
          }
          
          // Show interim results in real-time
          if (interimTranscript.trim()) {
            setRealTimeText(interimTranscript.trim());
            console.log('Real-time transcript:', interimTranscript.trim());
          }
          
          // If we have final results, use those
          if (finalTranscript.trim()) {
            setRealTimeText(finalTranscript.trim());
            console.log('Final real-time transcript:', finalTranscript.trim());
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Real-time speech recognition error:', event.error);
          // Don't show error immediately, let the main recognition handle it
        };

        recognitionRef.current.onstart = () => {
          console.log('Real-time speech recognition started');
        };

        recognitionRef.current.start();
        console.log('Real-time speech recognition started');
        
      } catch (error) {
        console.error('Failed to start real-time speech recognition:', error);
      }
    }
  };

  const stopRecording = async () => {
    try {
      if (!isRecordingRef.current) return;

      setIsRecording(false);
      isRecordingRef.current = false;
      setIsProcessing(true);

      // Stop animations
      pulseAnimation.stopAnimation();
      scaleAnimation.stopAnimation();

      // Clear duration timer
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // Stop real-time recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      // Get recording result
      const result: VoiceRecordingResult = await voiceService.stopRecording();
      
      if (result.success && result.text) {
        setIsSuccess(true);
        setRealTimeText(result.text);
        
        console.log('VoiceRecordingModal: Success! Text received:', result.text);
        
        // Set the text immediately
        onTextReceived(result.text);
        
        // Wait a moment to show success state, then close
        setTimeout(() => {
          console.log('VoiceRecordingModal: Closing modal');
          onClose();
        }, 1000);
      } else {
        console.log('VoiceRecordingModal: Error in result:', result.error);
        setError(result.error || 'Speech recognition failed. Please try again.');
        setRetryCount(prev => prev + 1);
      }

    } catch (error: any) {
      console.error('Error stopping recording:', error);
      setError(error.message || 'Failed to process recording. Please try again.');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelRecording = async () => {
    try {
      await voiceService.cancelRecording();
      
      // Stop animations
      pulseAnimation.stopAnimation();
      scaleAnimation.stopAnimation();

      // Clear duration timer
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // Stop real-time recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      setIsRecording(false);
      isRecordingRef.current = false;
      setIsProcessing(false);
      setError(null);
      setRealTimeText('');
      
      onClose();
    } catch (error) {
      console.error('Error cancelling recording:', error);
      onClose();
    }
  };

  const retryRecording = () => {
    setError(null);
    setRetryCount(0);
    startRecording();
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const tenths = Math.floor((milliseconds % 1000) / 100);
    return `${seconds}.${tenths}s`;
  };

  const renderRecordingIndicator = () => (
    <View className="items-center">
      <Animated.View
        style={{
          transform: [
            { scale: pulseAnimation },
            { scale: scaleAnimation }
          ]
        }}
        className="w-24 h-24 rounded-full bg-red-500 items-center justify-center mb-6"
      >
        <FontAwesome name="microphone" size={32} color="white" />
      </Animated.View>
      
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        Listening...
      </Text>
      
      <Text className="text-sm text-gray-600 mb-4 text-center">
        {Platform.OS === 'web' ? 'Speak clearly and loudly' : 'Speak naturally - voice recognition active'}
      </Text>
      
      <Text className="text-2xl font-bold text-red-500 mb-4">
        {formatDuration(recordingDuration)}
      </Text>
      
      {Platform.OS === 'web' && realTimeText && (
        <View className="bg-blue-50 p-4 rounded-lg mb-4 max-w-xs">
          <Text className="text-sm text-blue-800 text-center">
            &ldquo;{realTimeText}&rdquo;
          </Text>
        </View>
      )}
      
      {Platform.OS === 'web' && !realTimeText && recordingDuration > 2000 && (
        <View className="bg-yellow-50 p-3 rounded-lg mb-4 max-w-xs">
          <Text className="text-xs text-yellow-700 text-center">
            Speak louder or move closer to the microphone
          </Text>
        </View>
      )}
      
      <View className="flex-row space-x-4">
        <Pressable
          onPress={cancelRecording}
          className="bg-gray-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Cancel</Text>
        </Pressable>
        
        <Pressable
          onPress={stopRecording}
          className="bg-red-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Stop</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderProcessingIndicator = () => (
    <View className="items-center">
      <View className="w-24 h-24 rounded-full bg-blue-500 items-center justify-center mb-6">
        <FontAwesome name="cog" size={32} color="white" />
      </View>
      
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        Processing...
      </Text>
      
      <Text className="text-sm text-gray-600 text-center">
        Converting speech to text
      </Text>
    </View>
  );

  const renderSuccess = () => (
    <View className="items-center">
      <View className="w-24 h-24 rounded-full bg-green-500 items-center justify-center mb-6">
        <FontAwesome name="check" size={32} color="white" />
      </View>
      
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        Success!
      </Text>
      
      <Text className="text-sm text-gray-600 text-center mb-4">
        Your message has been added
      </Text>
    </View>
  );

  const renderError = () => (
    <View className="items-center">
      <View className="w-24 h-24 rounded-full bg-red-500 items-center justify-center mb-6">
        <FontAwesome name="exclamation-triangle" size={32} color="white" />
      </View>
      
      <Text className="text-lg font-semibold text-gray-800 mb-2 text-center">
        Speech Not Recognized
      </Text>
      
      <Text className="text-sm text-gray-600 text-center mb-4 px-4">
        {error}
      </Text>
      
      <View className="bg-yellow-50 p-4 rounded-lg mb-4 max-w-xs">
        <Text className="text-sm text-yellow-800 text-center font-medium mb-2">
          Tips for better speech recognition:
        </Text>
        <Text className="text-xs text-yellow-700 text-center">
          {Platform.OS === 'web' ? (
            <>
              • Speak clearly and at a normal pace{'\n'}
              • Ensure you&apos;re in a quiet environment{'\n'}
              • Keep the microphone close to your mouth{'\n'}
              • Try speaking for at least 2-3 seconds
            </>
          ) : (
            <>
              • Speak naturally at normal volume{'\n'}
              • Hold phone close to your mouth{'\n'}
              • Ensure good internet connection{'\n'}
              • Speak for at least 1-2 seconds
            </>
          )}
        </Text>
      </View>
      
      <View className="flex-row space-x-4">
        <Pressable
          onPress={retryRecording}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>
        
        <Pressable
          onPress={onClose}
          className="bg-gray-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Close</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={cancelRecording}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-3xl p-8 mx-6 max-w-sm w-full">
          {isProcessing ? renderProcessingIndicator() :
           isSuccess ? renderSuccess() :
           error ? renderError() :
           renderRecordingIndicator()}
        </View>
      </View>
    </Modal>
  );
};