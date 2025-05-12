import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { LogBox, Appearance } from 'react-native';
import { AxiosError } from 'axios';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import apiClient from '@/api/client';
import { useUserStore } from '@/store/userStore';

import '../global.css';

// Prevent the splash screen from auto-hiding before we're ready
SplashScreen.preventAutoHideAsync().catch(console.warn);

// App content component with user data loading
function AppContent() {
  // Fix for React 19 compatibility - use Appearance instead of useColorScheme
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  // Listen for color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      setColorScheme(newColorScheme);
    });
    
    return () => subscription.remove();
  }, []);
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <UserDataLoader isLoadingComplete={isLoadingComplete} setLoadingComplete={setLoadingComplete} />
    </ThemeProvider>
  );
}

// Separate component to handle user data loading
interface UserDataLoaderProps {
  isLoadingComplete: boolean;
  setLoadingComplete: React.Dispatch<React.SetStateAction<boolean>>;
}

function UserDataLoader({ isLoadingComplete, setLoadingComplete }: UserDataLoaderProps) {
  const setUser = useUserStore(state => state.setUser);
  const router = useRouter();
  
  // Load resources and data
  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.hideAsync();
        
        // Fetch user data
        try {
          const response = await apiClient.get('/api/v1/user');
          console.log(response.data);
          
          setUser(response.data);
        } catch (error: unknown) {
          console.error("API call failed:", error);
          const axiosError = error as AxiosError;
          if (axiosError.response && axiosError.response.status === 401) {
            router.replace('/(auth)/login' as any);
          }
          if (axiosError.response && axiosError.response.status === 408) {
            router.replace('/(auth)/verify' as any);
          }
        }
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        setLoadingComplete(true);
      }
    }

    if (!isLoadingComplete) {
      prepare();
    }
  }, [isLoadingComplete, setLoadingComplete, setUser, router]);
  
  return <Slot />;
}

// Root component that sets up providers
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}