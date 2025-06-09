import React from 'react';
import { View, Text, Modal, Pressable, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: CustomAlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'primary' }],
  type = 'info',
  onClose
}) => {
  const screenHeight = Dimensions.get('window').height;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle', color: '#10B981' };
      case 'error':
        return { name: 'times-circle', color: '#EF4444' };
      case 'warning':
        return { name: 'exclamation-triangle', color: '#F59E0B' };
      default:
        return { name: 'info-circle', color: '#3B82F6' };
    }
  };

  const getButtonStyle = (style: string) => {
    switch (style) {
      case 'primary':
        return 'bg-primary';
      case 'destructive':
        return 'bg-red-500';
      case 'cancel':
        return 'bg-gray-200';
      default:
        return 'bg-gray-100';
    }
  };

  const getButtonTextStyle = (style: string) => {
    switch (style) {
      case 'primary':
      case 'destructive':
        return 'text-white';
      case 'cancel':
        return 'text-gray-700';
      default:
        return 'text-gray-600';
    }
  };

  const icon = getIcon();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View 
          className="bg-white rounded-3xl w-full max-w-sm shadow-2xl"
          style={{ maxHeight: screenHeight * 0.8 }}
        >
          {/* Header with Icon */}
          <View className="items-center pt-8 pb-4">
            <View 
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: icon.color + '20' }}
            >
              <FontAwesome 
                name={icon.name as any} 
                size={32} 
                color={icon.color} 
              />
            </View>
            
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              {title}
            </Text>
          </View>

          {/* Message */}
          <View className="px-6 pb-6">
            <Text className="text-gray-600 text-center leading-6 text-base">
              {message}
            </Text>
          </View>

          {/* Buttons */}
          <View className="px-6 pb-6">
            {buttons.length === 1 ? (
              // Single button
              <Pressable
                onPress={() => {
                  buttons[0].onPress?.();
                  onClose?.();
                }}
                className={`py-4 rounded-xl ${getButtonStyle(buttons[0].style || 'default')}`}
              >
                <Text className={`text-center font-semibold text-lg ${getButtonTextStyle(buttons[0].style || 'default')}`}>
                  {buttons[0].text}
                </Text>
              </Pressable>
            ) : buttons.length === 2 ? (
              // Two buttons side by side
              <View className="flex-row space-x-3">
                {buttons.map((button, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      button.onPress?.();
                      onClose?.();
                    }}
                    className={`flex-1 py-4 rounded-xl ${getButtonStyle(button.style || 'default')}`}
                  >
                    <Text className={`text-center font-semibold ${getButtonTextStyle(button.style || 'default')}`}>
                      {button.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              // Multiple buttons stacked
              <View className="space-y-2">
                {buttons.map((button, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      button.onPress?.();
                      onClose?.();
                    }}
                    className={`py-4 rounded-xl ${getButtonStyle(button.style || 'default')}`}
                  >
                    <Text className={`text-center font-semibold ${getButtonTextStyle(button.style || 'default')}`}>
                      {button.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Hook for easier usage
export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: CustomAlertButton[];
    type?: 'success' | 'error' | 'warning' | 'info';
  }>({
    visible: false,
    title: '',
    message: ''
  });

  const showAlert = (config: Omit<typeof alertConfig, 'visible'>) => {
    setAlertConfig({ ...config, visible: true });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <CustomAlert
      {...alertConfig}
      onClose={hideAlert}
    />
  );

  return {
    showAlert,
    hideAlert,
    AlertComponent
  };
};

export default CustomAlert; 