import React, { useState, useEffect } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Field-specific validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const router = useRouter();
  const setUser = useSetRecoilState(userAtom);

  const togglePassword = () => setShowPassword(!showPassword);
  
  // Validation functions
  const validateName = (value: string) => {
    if (value.trim().length < 3) {
      setNameError('Name must be at least 3 characters');
      return false;
    }
    setNameError('');
    return true;
  };
  
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };
  
  const validatePhone = (value: string) => {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(value)) {
      setPhoneError('Phone number must be 10 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };
  
  const validatePassword = (value: string) => {
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    
    // Check for at least one uppercase letter, one lowercase letter, and one number
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setPasswordError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
      return false;
    }
    
    setPasswordError('');
    return true;
  };
  
  const validateConfirmPassword = (value: string) => {
    if (value !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };
  
  // Handle text change with validation
  const handleNameChange = (text: string) => {
    setName(text);
    if (nameError) validateName(text);
  };
  
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) validateEmail(text);
  };
  
  const handlePhoneChange = (text: string) => {
    // Only allow digits
    const digitsOnly = text.replace(/\D/g, '');
    setPhone(digitsOnly);
    if (phoneError) validatePhone(digitsOnly);
  };
  
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) validatePassword(text);
    if (confirmPassword) validateConfirmPassword(confirmPassword);
  };
  
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) validateConfirmPassword(text);
  };

  const handleRegister = async () => {
    // Validate all fields
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid || !isConfirmPasswordValid) {
      setError('Please fix the errors in the form');
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
        role
      });
      
      // Store token and set user data
      await store.set('token', response.data.token);
      setUser(response.data.user);

      // Navigate to verification page
      router.replace('/(auth)/verify' as any);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const RoleBox = ({ title, value, icon }: { title: string, value: string, icon: string }) => {
    const isSelected = role === value;
    return (
      <TouchableOpacity
        onPress={() => setRole(value)}
        style={{
          flex: 1,
          padding: 12,
          borderRadius: 8,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
          borderColor: isSelected ? '#4F46E5' : '#E5E7EB',
        }}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={24}
          color={isSelected ? '#4F46E5' : '#6B7280'}
        />
        <Text
          style={{
            marginTop: 4,
            fontSize: 12,
            color: isSelected ? '#4F46E5' : '#6B7280',
            fontWeight: isSelected ? 'bold' : 'normal',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
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
              onChangeText={handleNameChange}
              placeholder="Enter your full name"
              iconName="account-outline"
              error={nameError}
            />

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
              label="Phone"
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="Enter your phone number"
              iconName="phone-outline"
              keyboardType="phone-pad"
              error={phoneError}
            />

            <View className="mb-4">
              <Text className="text-text-primary mb-1 font-medium" style={{ fontFamily: 'System' }}>
                Choose Your Role
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <RoleBox title="User" value="user" icon="account-outline" />
                <RoleBox title="Doctor" value="doctor" icon="doctor" />
                <RoleBox title="Laboratory" value="laboratory" icon="microscope" />
                <RoleBox title="Delivery" value="deliverypartner" icon="bike" />
              </View>
            </View>

            <FormInput
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Create a password"
              iconName="lock-outline"
              secureTextEntry
              showPassword={showPassword}
              togglePassword={togglePassword}
              error={passwordError}
            />

            <FormInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              placeholder="Confirm your password"
              iconName="lock-check-outline"
              secureTextEntry
              showPassword={showPassword}
              error={confirmPasswordError}
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