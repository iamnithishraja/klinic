import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/api/client';
import { store } from '@/utils';
import { useSetRecoilState } from 'recoil';
import { userAtom } from '@/store/userAtoms';

// Components
import FormInput from '@/components/FormInput';
import FormButton from '@/components/FormButton';
import ErrorMessage from '@/components/ErrorMessage';
import FloatingIcons from '@/components/FloatingIcons';
import Logo from '@/components/Logo';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setUser = useSetRecoilState(userAtom);

  const togglePassword = () => setShowPassword(!showPassword);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/v1/login', { email, password });
      
      // Store token and set user data
      await store.set('token', response.data.token);
      setUser(response.data.user);

      // Navigate to home
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#F9FAFB', '#EEF2FF']}
      style={{ flex: 1 }}
    >
      <FloatingIcons />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1" 
          contentContainerStyle={{ padding: 24, paddingTop: 48, paddingBottom: 32 }}
        >
          <Logo size="large" showTagline />

          <View 
            style={{ 
              marginTop: 24, 
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: 24,
              borderRadius: 16,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
          >
            <Text 
              style={{ 
                fontSize: 24, 
                color: '#4F46E5', 
                marginBottom: 24, 
                fontWeight: 'bold',
                fontFamily: 'System' 
              }}
            >
              Welcome Back
            </Text>
            
            <ErrorMessage message={error} />

            <FormInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              iconName="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FormInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              iconName="lock-outline"
              secureTextEntry
              showPassword={showPassword}
              togglePassword={togglePassword}
            />

            <FormButton
              title="Login"
              onPress={handleLogin}
              loading={loading}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Text 
                style={{ 
                  color: '#6B7280',
                  fontFamily: 'System' 
                }}
              >
                Don't have an account? 
              </Text>
              <Link href={"/(auth)/register" as any} asChild>
                <TouchableOpacity>
                  <Text 
                    style={{ 
                      color: '#4F46E5', 
                      marginLeft: 4, 
                      fontWeight: 'bold',
                      fontFamily: 'System' 
                    }}
                  >
                    Register
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
} 