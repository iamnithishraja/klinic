// @ts-ignore
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { LogBox, Appearance, Platform } from 'react-native';
import { AxiosError } from 'axios';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import apiClient from '@/api/client';
import { useUserStore } from '@/store/userStore';
import { getInitialRoute, shouldShowLandingPage, isWeb } from '@/utils/platformUtils';

import '../global.css';

// Prevent the splash screen from auto-hiding before we're ready
SplashScreen.preventAutoHideAsync().catch(console.warn);

// App content component with user data loading
function AppContent() {
  // Fix for React 19 compatibility - use Appearance instead of useColorScheme
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Listen for color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      setColorScheme(newColorScheme);
    });
    
    return () => subscription.remove();
  }, []);

  // Set ready state after component mounts
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <UserDataLoader 
        isLoadingComplete={isLoadingComplete} 
        setLoadingComplete={setLoadingComplete}
        isReady={isReady}
      />
    </>
  );
}

// Separate component to handle user data loading
interface UserDataLoaderProps {
  isLoadingComplete: boolean;
  setLoadingComplete: React.Dispatch<React.SetStateAction<boolean>>;
  isReady: boolean;
}

function UserDataLoader({ isLoadingComplete, setLoadingComplete, isReady }: UserDataLoaderProps) {
  const setUser = useUserStore(state => state.setUser);
  const router = useRouter();
  
  // Load resources and data
  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.hideAsync();
        
        // Only proceed with navigation logic after component is ready
        if (!isReady) return;
        
        // On web, if we're on landing page, don't try to fetch user data yet
        if (isWeb) {
          console.log('Web platform: showing landing page');
        } else {
          // For mobile, check authentication
          try {
            const response = await apiClient.get('/api/v1/user');
            console.log(response.data);
            
            // User is authenticated, set user data
            setUser(response.data);
            
            // If on mobile, always redirect to tabs when authenticated
            if (!isWeb) {
              router.replace('/(tabs)' as any);
            }
          } catch (error: unknown) {
            console.error("API call failed:", error);
            const axiosError = error as AxiosError;
            
            // Handle authentication errors
            if (axiosError.response && axiosError.response.status === 401) {
              // If on mobile, redirect to login
              if (!isWeb) {
                router.replace('/(auth)/login' as any);
              }
            }
            if (axiosError.response && axiosError.response.status === 408) {
              router.replace('/(auth)/verify' as any);
            }
          }
        }
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        setLoadingComplete(true);
      }
    }

    if (!isLoadingComplete && isReady) {
      prepare();
    }
  }, [isLoadingComplete, setLoadingComplete, setUser, router, isReady]);
  
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