import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5', // Primary color from theme
        tabBarInactiveTintColor: '#6B7280', // Text secondary color from theme
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderTopWidth: 0,
            elevation: 0,
            height: 88,
            paddingBottom: 20,
          },
          default: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 0,
            elevation: 8,
            height: 64,
            paddingBottom: 8,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house" color={color} weight="medium" />,
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Doctors',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="stethoscope" color={color} weight="medium" />,
        }}
      />
      <Tabs.Screen
        name="laboratories"
        options={{
          title: 'Laboratories',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="cross.case" color={color} weight="medium" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.circle" color={color} weight="medium" />,
        }}
      />
    </Tabs>
  );
}
