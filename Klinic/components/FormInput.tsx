import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  iconName: string;
  secureTextEntry?: boolean;
  showPassword?: boolean;
  togglePassword?: () => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  containerStyle?: string;
  onPress?: () => void;
  rightText?: string;
}

const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder = '',
  iconName,
  secureTextEntry = false,
  showPassword = false,
  togglePassword,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  containerStyle = '',
  onPress,
  rightText,
}: FormInputProps) => {
  const inputContainer = (
    <View className={`flex-row items-center border rounded-xl px-4 py-3 bg-white shadow-sm ${error ? 'border-red-500' : 'border-divider'}`}>
      <MaterialCommunityIcons 
        name={iconName as any} 
        size={22} 
        color={error ? "#EF4444" : "#4F46E5"} 
        style={{ marginRight: 8 }}
      />
      <TextInput
        className="flex-1 text-text-primary"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#9CA3AF"
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        style={{ 
          fontFamily: 'System',
          paddingRight: secureTextEntry || rightText ? 40 : 0,
          textAlignVertical: multiline ? 'top' : 'center',
          minHeight: multiline ? numberOfLines * 20 : undefined,
        }}
      />
      {rightText && (
        <Text className="text-text-secondary text-sm mr-2">
          {rightText}
        </Text>
      )}
      {secureTextEntry && togglePassword && (
        <TouchableOpacity 
          onPress={togglePassword}
          style={{
            position: 'absolute',
            right: 12,
            padding: 4
          }}
        >
          <FontAwesome 
            name={showPassword ? "eye" : "eye-slash"} 
            size={20} 
            color={error ? "#EF4444" : "#4F46E5"} 
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View className={`mb-4 ${containerStyle}`}>
      <Text className="text-text-primary mb-2 font-medium">{label}</Text>
      
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          {inputContainer}
        </TouchableOpacity>
      ) : (
        inputContainer
      )}
      
      {error ? (
        <Text className="text-red-500 text-xs mt-1 ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default FormInput; 