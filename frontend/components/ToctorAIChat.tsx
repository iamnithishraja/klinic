import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '@/api/client';
import { ChatHeader } from './chat/ChatHeader';
import { MessageBubble } from './chat/MessageBubble';
import { ChatInput } from './chat/ChatInput';
import { LoadingIndicator } from './chat/LoadingIndicator';
import VoiceRecognitionModal from './chat/VoiceRecognitionModal';

const { height: screenHeight } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface ToctorAIChatProps {
  visible: boolean;
  onClose: () => void;
}

const ToctorAIChat: React.FC<ToctorAIChatProps> = ({ visible, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [modalHeight] = useState(new Animated.Value(0));
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [setTextDirectly, setSetTextDirectly] = useState<((text: string) => void) | null>(null);

  // Initialize chat with welcome message
  useEffect(() => {
    if (visible && messages.length === 0) {
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `<medical_assessment>
Welcome! I'm Toctor AI, your personal medical assistant. I have access to your complete medical profile, including your health history, recent appointments, prescriptions, and lab results.
</medical_assessment>

<recommendations>
<recommendation type="immediate">
I'm here to help you with symptom analysis, health recommendations, and medical guidance based on your personal health data.
</recommendation>
</recommendations>

<next_steps>
What health concern would you like to discuss today? You can ask me about:
• Symptom analysis and preliminary assessments
• Lab test recommendations
• Medication questions
• Health trends from your medical history
• Preventive care suggestions
</next_steps>`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [visible, messages.length]);

  // Handle modal animation
  useEffect(() => {
    if (visible) {
      Animated.spring(modalHeight, {
        toValue: screenHeight * 0.9,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(modalHeight, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible, modalHeight]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);

  // Debug inputText changes
  useEffect(() => {
    // Removed console.log to prevent React Native error
  }, [inputText]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/api/v1/ai/chat', {
        message: userMessage.content,
        conversationId,
      });

      if (response.data.success) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.data.response,
          timestamp: response.data.timestamp || new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setConversationId(response.data.conversationId);
      } else {
        throw new Error('Failed to get response from AI');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `<warnings>
I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.

Error details: ${error instanceof Error ? error.message : 'Unknown error'}
</warnings>`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    setShowVoiceModal(true);
  };

  const handleVoiceTextReceived = (text: string) => {
    console.log('Received voice text in ToctorAIChat:', text);
    console.log('Current inputText before setting:', inputText);
    
    // Set the text immediately
    setInputText(text);
    
    // Also use direct text setting if available
    if (setTextDirectly) {
      setTextDirectly(text);
    }
    
    console.log('InputText should now be set to:', text);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/60">
        <Animated.View 
          style={{ height: modalHeight }}
          className="absolute bottom-0 left-0 right-0 bg-gray-50 rounded-t-3xl overflow-hidden shadow-2xl"
        >
          <SafeAreaView className="flex-1">
            {/* Header */}
            <ChatHeader onClose={onClose} />

            {/* Messages */}
            <ScrollView 
              ref={scrollViewRef}
              className="flex-1 px-4 pt-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isLoading && <LoadingIndicator />}
            </ScrollView>

            {/* Input Area */}
            <ChatInput
              inputText={inputText}
              setInputText={setInputText}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              onVoiceInput={handleVoiceInput}
              setTextDirectly={setSetTextDirectly}
            />
          </SafeAreaView>
        </Animated.View>
      </View>

      {/* Voice Recording Modal */}
      <VoiceRecognitionModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onTextReceived={handleVoiceTextReceived}
      />
    </Modal>
  );
};

export default ToctorAIChat; 