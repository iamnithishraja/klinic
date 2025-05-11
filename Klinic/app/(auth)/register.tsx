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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setUser = useSetRecoilState(userAtom);

  const togglePassword = () => setShowPassword(!showPassword);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/v1/register', {
        name,
        email,
        phone,
        password,
        role: 'patient' // Default role
      });
      
      // Store token and set user data
      await store.set('token', response.data.token);
      setUser(response.data.user);

      // Navigate to home
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
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
          contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: 24 }}
        >
          <Logo size="medium" />

          <View 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: 24,
              borderRadius: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
          >
            <Text 
              className="text-2xl text-primary mb-5" 
              style={{ fontFamily: 'System', fontWeight: 'bold' }}
            >
              Create Account
            </Text>
            
            <ErrorMessage message={error} />

            <FormInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              iconName="account-outline"
            />

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
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              iconName="phone-outline"
              keyboardType="phone-pad"
            />

            <FormInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              iconName="lock-outline"
              secureTextEntry
              showPassword={showPassword}
              togglePassword={togglePassword}
            />

            <FormInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              iconName="lock-check-outline"
              secureTextEntry
              showPassword={showPassword}
            />

            <FormButton
              title="Register"
              onPress={handleRegister}
              loading={loading}
            />

            <View className="flex-row justify-center">
              <Text 
                className="text-text-secondary"
                style={{ fontFamily: 'System' }}
              >
                Already have an account? 
              </Text>
              <Link href={"/(auth)/login" as any} asChild>
                <TouchableOpacity>
                  <Text 
                    className="text-primary ml-1 font-bold"
                    style={{ fontFamily: 'System' }}
                  >
                    Login
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