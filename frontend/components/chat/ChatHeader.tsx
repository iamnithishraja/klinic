import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface ChatHeaderProps {
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => {
  return (
    <View style={{
      backgroundColor: '#7C3AED',
      paddingHorizontal: 24,
      paddingVertical: 16,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}>
            <FontAwesome name="comments" size={20} color="white" />
          </View>
          <View>
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold',
            }}>
              Toctor AI
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#10B981',
                marginRight: 6,
              }} />
              <Text style={{
                color: '#E9D5FF',
                fontSize: 14,
              }}>
                Online • Your Medical Assistant
              </Text>
            </View>
          </View>
        </View>
        <Pressable 
          onPress={onClose} 
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <FontAwesome name="times" size={20} color="white" />
        </Pressable>
      </View>
    </View>
  );
}; 