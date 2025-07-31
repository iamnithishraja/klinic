import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUserStore } from '@/store/userStore';

export default function TabLayout() {
  const { user } = useUserStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5', // Primary color from theme
        tabBarInactiveTintColor: '#6B7280', // Text secondary color from theme
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
        ),
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={24} name="house" color={color} weight="medium" />,
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Doctors',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={24} name="stethoscope" color={color} weight="medium" />,
        }}
      />
      <Tabs.Screen
        name="laboratories"
        options={{
          title: 'Laboratories',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={24} name="cross.case" color={color} weight="medium" />,
        }}
      />
      <Tabs.Screen
        name="medicines"
        options={{
          title: 'Medicines',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={24} name="pharmacy" color={color} weight="medium" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={24} name="person.circle" color={color} weight="medium" />,
        }}
      />
    </Tabs>
  );
}
