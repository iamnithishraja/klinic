import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { parseXMLContent } from './XMLParser';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <View className="mb-6 items-center">
      <View 
        className="w-[95%] max-w-[600px]"
        style={{
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
        }}
      >
        {/* Avatar */}
        <View 
          className={`w-10 h-10 rounded-full items-center justify-center shadow-md ${
            isUser ? 'ml-3 bg-violet-500' : 'mr-3 bg-violet-600'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <FontAwesome 
            name={isUser ? 'user' : 'android'} 
            size={18} 
            color="#FFFFFF" 
          />
        </View>
        
        {/* Message Content */}
        <View 
          className={`flex-1 rounded-2xl shadow-md ${
            isUser 
              ? 'bg-violet-500 px-4 py-3' 
              : 'bg-white border border-gray-200 p-1'
          }`}
          style={{
            borderTopLeftRadius: isUser ? 20 : 8,
            borderTopRightRadius: isUser ? 8 : 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {isUser ? (
            <Text className="text-white text-base leading-6 font-medium">
              {message.content}
            </Text>
          ) : (
            <View className="p-3">
              {parseXMLContent(message.content)}
            </View>
          )}
        </View>
      </View>
      
      {/* Timestamp */}
      <Text className="text-xs text-gray-400 mt-2 font-medium text-center">
        {new Date(message.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })}
      </Text>
    </View>
  );
}; 