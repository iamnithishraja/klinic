import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export const getInitialRoute = (): string => {
  if (isWeb) {
    return '/landing';
  } else {
    return '/(auth)/login';
  }
};

export const shouldShowLandingPage = (): boolean => {
  return isWeb;
};

export const getAuthRoute = (): string => {
  return '/(auth)/login';
};

export const getRegisterRoute = (): string => {
  return '/(auth)/register';
};

export const getDashboardRoute = (): string => {
  return '/(tabs)';
}; 