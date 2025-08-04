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
    const route = getInitialRoute();
    setInitialRoute(route);
    
    // Force navigation to landing page on web
    if (isWeb && route === '/landing') {
      const router = useRouter();
      router.replace('/landing' as any);
    }
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
        
        // On web, if we're on landing page, don't try to fetch user data yet
        if (isWeb && initialRoute === '/landing') {
          // On web, we want to show landing page first, so don't redirect
          console.log('Web platform: showing landing page');
        } else {
          // For mobile or web (when not on landing page), check authentication
          try {
            const response = await apiClient.get('/api/v1/user');
            console.log(response.data);
            
            // User is authenticated, set user data
            setUser(response.data);
            
            // If on mobile, always redirect to tabs when authenticated
            if (!isWeb) {
              router.replace('/(tabs)' as any);
            }
            // On web, only redirect if not already on landing page
            else if (initialRoute !== '/landing') {
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
              // On web, redirect to landing page if not already there
              else if (initialRoute !== '/landing') {
                router.replace('/landing' as any);
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