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
import { getInitialRoute, shouldShowLandingPage } from '@/utils/platformUtils';

import '../global.css';

// Prevent the splash screen from auto-hiding before we're ready
SplashScreen.preventAutoHideAsync().catch(console.warn);

// App content component with user data loading
function AppContent() {
  // Fix for React 19 compatibility - use Appearance instead of useColorScheme
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  // Listen for color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      setColorScheme(newColorScheme);
    });
    
    return () => subscription.remove();
  }, []);

  // Platform-specific routing logic
  useEffect(() => {
    setInitialRoute(getInitialRoute());
  }, []);
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <UserDataLoader 
        isLoadingComplete={isLoadingComplete} 
        setLoadingComplete={setLoadingComplete}
        initialRoute={initialRoute}
      />
    </>
  );
}

// Separate component to handle user data loading
interface UserDataLoaderProps {
  isLoadingComplete: boolean;
  setLoadingComplete: React.Dispatch<React.SetStateAction<boolean>>;
  initialRoute: string | null;
}

function UserDataLoader({ isLoadingComplete, setLoadingComplete, initialRoute }: UserDataLoaderProps) {
  const setUser = useUserStore(state => state.setUser);
  const router = useRouter();
  
  // Load resources and data
  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.hideAsync();
        
        // Only check authentication if not on web landing page
        if (!shouldShowLandingPage() || initialRoute !== '/landing') {
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
        }
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        setLoadingComplete(true);
      }
    }

    if (!isLoadingComplete && initialRoute) {
      prepare();
    }
  }, [isLoadingComplete, setLoadingComplete, setUser, router, initialRoute]);
  
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