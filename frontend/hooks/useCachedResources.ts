import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

export function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  // Load any resources or data that we need prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        // Load fonts
        await Font.loadAsync({
          'Roboto': require('../assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Bold': require('../assets/fonts/Roboto-Bold.ttf'),
          'OpenSans': require('../assets/fonts/OpenSans-Regular.ttf'),
          'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
          'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
        }).catch(e => {
          console.warn('Font loading error:', e);
          // Continue even if font loading fails
        });
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn('Error loading resources:', e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync().catch(e => {
          console.warn('Error hiding splash screen:', e);
        });
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
} 