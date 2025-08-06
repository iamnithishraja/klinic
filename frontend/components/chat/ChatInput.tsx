import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { VoiceButton } from './VoiceButton';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  onVoiceInput?: () => void;
  setTextDirectly?: (setter: (text: string) => void) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  inputText, 
  setInputText, 
  onSendMessage, 
  isLoading,
  onVoiceInput,
  setTextDirectly
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // Ensure inputText is always a string to avoid null/undefined errors
  const safeInputText = typeof inputText === 'string' ? inputText : '';

  // Debug inputText changes - removed console.log to fix React Native error
  useEffect(() => {
    // Removed console.log to prevent React Native error
  }, [safeInputText]);

  // Method to set text directly
  const setTextDirectlyInternal = (text: string) => {
    console.log('ChatInput: Setting text directly to:', text);
    setInputText(text);
    
    // Use platform-specific methods to set text
    if (textInputRef.current) {
      if (Platform.OS === 'web') {
        // For web, we can't use setNativeProps, so we rely on the state update
        // The TextInput should update automatically when the value prop changes
        console.log('Web platform: Text will be set via state update');
      } else {
        // For native platforms, use setNativeProps
        try {
          textInputRef.current.setNativeProps({ text });
        } catch (error) {
          console.log('setNativeProps not available, using state update');
        }
      }
    }
  };

  // Expose the setTextDirectly method to parent
  useEffect(() => {
    if (setTextDirectly) {
      setTextDirectly(setTextDirectlyInternal);
    }
  }, [setTextDirectly]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardOpen(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardOpen(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView behavior="padding" className="bg-gray-50 border-t border-gray-200">
      <View className={`flex-row items-end px-4 py-4 pt-5 min-h-[80px] ${isKeyboardOpen ? 'mb-24' : 'mb-2'}`}>
        <View className="flex-1 mr-3 relative">
          <TextInput
            ref={textInputRef}
            key={`input-${safeInputText.length}`} // Force re-render when text changes
            value={safeInputText}
            onChangeText={setInputText}
            placeholder="Describe your symptoms or ask a health question..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            className="bg-white rounded-3xl px-5 py-4 pr-12 text-base leading-6 max-h-[120px] min-h-[48px] border border-gray-200 shadow-sm"
            style={{
              textAlignVertical: 'top',
            }}
            onSubmitEditing={onSendMessage}
            editable={!isLoading}
          />
          
          {/* Character count indicator */}
          <View className="absolute bottom-2 right-3">
            <View className="bg-gray-100 px-2 py-1 rounded-xl">
              <FontAwesome 
                name="pencil" 
                size={12} 
                color={safeInputText.length > 800 ? '#EF4444' : '#6B7280'} 
              />
            </View>
          </View>
        </View>
        
        {/* Voice Button */}
        {onVoiceInput && (
          <View className="mr-3">
            <VoiceButton
              onPress={onVoiceInput}
              disabled={isLoading}
            />
          </View>
        )}
        
        <Pressable
          onPress={onSendMessage}
          disabled={!safeInputText.trim() || isLoading}
          className="w-14 h-14 rounded-full bg-violet-500 items-center justify-center shadow-lg"
          style={({ pressed }) => ({
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            opacity: (!safeInputText.trim() || isLoading) ? 0.6 : (pressed ? 0.8 : 1),
            transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
          })}
        >
          <FontAwesome 
            name={isLoading ? "hourglass-half" : "send"} 
            size={20} 
            color="#FFFFFF" 
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};