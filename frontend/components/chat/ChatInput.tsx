import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  inputText, 
  setInputText, 
  onSendMessage, 
  isLoading 
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

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
            value={inputText}
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
                color={inputText.length > 800 ? '#EF4444' : '#6B7280'} 
              />
            </View>
          </View>
        </View>
        
        <Pressable
          onPress={onSendMessage}
          disabled={!inputText.trim() || isLoading}
          className="w-14 h-14 rounded-full bg-violet-500 items-center justify-center shadow-lg"
          style={({ pressed }) => ({
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            opacity: (!inputText.trim() || isLoading) ? 0.6 : (pressed ? 0.8 : 1),
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