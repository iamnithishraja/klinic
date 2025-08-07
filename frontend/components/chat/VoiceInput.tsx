import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import VoiceRecognitionModal from './VoiceRecognitionModal';
import { voiceService } from '../../services/voiceService';

interface VoiceInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  initialText?: string;
  onTextChange?: (text: string) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onSend,
  placeholder = "Type a message or use voice...",
  disabled = false,
  className = "",
  initialText = "",
  onTextChange,
}) => {
  const [text, setText] = useState(initialText);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const micScale = useRef(new Animated.Value(1)).current;

  // Check if web speech is supported
  const isWebSpeechSupported = voiceService.isWebSpeechSupported();

  // Update text when initialText changes
  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  // Notify parent of text changes
  useEffect(() => {
    if (onTextChange) {
      onTextChange(text);
    }
  }, [text, onTextChange]);

  const handleMicPress = () => {
    if (disabled || !isWebSpeechSupported) return;
    setShowVoiceModal(true);
  };

  const handleVoiceTextReceived = (recognizedText: string) => {
    setText(recognizedText);
    setError(null);
  };

  const handleSend = () => {
    const trimmedText = text.trim();
    if (trimmedText && !disabled) {
      onSend(trimmedText);
      setText('');
    }
  };

  const handleMicPressIn = () => {
    if (!disabled && isWebSpeechSupported) {
      Animated.spring(micScale, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleMicPressOut = () => {
    if (!disabled && isWebSpeechSupported) {
      Animated.spring(micScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={`bg-gray-50 border-t border-gray-200 ${className}`}
      >
        <View className="flex-row items-end px-4 py-4 pt-5 min-h-[80px]">
          <View className="flex-1 mr-3 relative">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
              className="bg-white rounded-3xl px-5 py-4 pr-12 text-base leading-6 max-h-[120px] min-h-[48px] border border-gray-200 shadow-sm"
              style={{
                textAlignVertical: 'top',
              }}
              onSubmitEditing={handleSend}
              editable={!disabled}
            />
            
            {/* Character count indicator */}
            <View className="absolute bottom-2 right-3">
              <View className="bg-gray-100 px-2 py-1 rounded-xl">
                <FontAwesome 
                  name="pencil" 
                  size={12} 
                  color={text.length > 800 ? '#EF4444' : '#6B7280'} 
                />
              </View>
            </View>
          </View>
          
          {/* Voice Button - Only show on web */}
          {Platform.OS === 'web' && (
            <Animated.View 
              style={{ transform: [{ scale: micScale }] }}
              className="mr-3"
            >
              <Pressable
                onPress={handleMicPress}
                onPressIn={handleMicPressIn}
                onPressOut={handleMicPressOut}
                disabled={disabled || !isWebSpeechSupported}
                className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${
                  disabled || !isWebSpeechSupported
                    ? 'bg-gray-300' 
                    : 'bg-green-500'
                }`}
                style={({ pressed }) => ({
                  shadowColor: disabled || !isWebSpeechSupported ? '#9CA3AF' : '#10B981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                  opacity: disabled || !isWebSpeechSupported ? 0.6 : (pressed ? 0.8 : 1),
                })}
              >
                <FontAwesome 
                  name="microphone" 
                  size={18} 
                  color="white" 
                />
              </Pressable>
            </Animated.View>
          )}
          
          {/* Send Button */}
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            className="w-14 h-14 rounded-full bg-violet-500 items-center justify-center shadow-lg"
            style={({ pressed }) => ({
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              opacity: !canSend ? 0.6 : (pressed ? 0.8 : 1),
              transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
            })}
          >
            <FontAwesome 
              name="send" 
              size={20} 
              color="#FFFFFF" 
            />
          </Pressable>
        </View>

        {/* Error Display */}
        {error && (
          <View className="px-4 pb-2">
            <Text className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </Text>
          </View>
        )}

        {/* Web Speech Support Notice */}
        {Platform.OS === 'web' && !isWebSpeechSupported && (
          <View className="px-4 pb-2">
            <Text className="text-orange-600 text-xs text-center bg-orange-50 p-2 rounded-lg">
              Voice input requires Chrome, Edge, or Safari
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Voice Recognition Modal */}
      <VoiceRecognitionModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onTextReceived={handleVoiceTextReceived}
      />
    </>
  );
}; 