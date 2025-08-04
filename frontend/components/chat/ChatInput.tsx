import React, { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { VoiceInput } from './VoiceInput';

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

  const handleSend = (text: string) => {
    setInputText(text);
    onSendMessage();
  };

  return (
    <KeyboardAvoidingView 
      behavior="padding" 
      className={`bg-gray-50 border-t border-gray-200 ${isKeyboardOpen ? 'mb-24' : 'mb-2'}`}
    >
      <VoiceInput
        onSend={handleSend}
        placeholder="Describe your symptoms or ask a health question..."
        disabled={isLoading}
        initialText={inputText}
        onTextChange={setInputText}
      />
    </KeyboardAvoidingView>
  );
};