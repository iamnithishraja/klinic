import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
// @ts-ignore
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/api/client';
import { store } from '@/utils';
import { useUserStore } from '@/store/userStore';

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
  
  // Field-specific validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const router = useRouter();
  const setUser = useUserStore(state => state.setUser);

  const togglePassword = () => setShowPassword(!showPassword);
  
  // Validation functions
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };
  
  const validatePassword = (value: string) => {
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };
  
  // Handle text change with validation
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) validateEmail(text);
  };
  
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) validatePassword(text);
  };

  const handleLogin = async () => {
    // Validate fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      setError('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/v1/login', { email, password });
      
      // Store token and set user data
      await store.set('token', response.data.token);
      setUser(response.data.user);

      // Navigate to home based on user role
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle suspension errors specifically
      if (error.response?.status === 403 && error.response?.data?.message?.includes('suspended')) {
        const suspensionData = error.response.data;
        let suspensionMessage = 'Your account has been suspended.';
        
        if (suspensionData.reason) {
          suspensionMessage += `\nReason: ${suspensionData.reason}`;
        }
        
        if (suspensionData.suspendedAt) {
          const suspendedDate = new Date(suspensionData.suspendedAt).toLocaleDateString();
          suspensionMessage += `\nSuspended on: ${suspendedDate}`;
        }
        
        if (suspensionData.expiresAt) {
          const expiryDate = new Date(suspensionData.expiresAt).toLocaleDateString();
          suspensionMessage += `\nSuspension expires: ${expiryDate}`;
        } else {
          suspensionMessage += '\nThis is a permanent suspension.';
        }
        
        suspensionMessage += '\n\nPlease contact support for assistance.';
        setError(suspensionMessage);
      } else {
        setError(error.response?.data?.message || 'Login failed. Please try again.');
      }
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
              onChangeText={handleEmailChange}
              placeholder="Enter your email"
              iconName="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
            />

            <FormInput
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Enter your password"
              iconName="lock-outline"
              secureTextEntry
              showPassword={showPassword}
              togglePassword={togglePassword}
              error={passwordError}
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