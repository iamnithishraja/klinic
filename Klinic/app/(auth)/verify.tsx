import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import apiClient from '@/api/client';

// Components
import FormInput from '@/components/FormInput';
import FormButton from '@/components/FormButton';
import ErrorMessage from '@/components/ErrorMessage';
import FloatingIcons from '@/components/FloatingIcons';
import Logo from '@/components/Logo';

export default function Verify() {
    const [emailOtp, setEmailOtp] = React.useState('');
    const [phoneOtp, setPhoneOtp] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [resendLoading, setResendLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');
    const [timer, setTimer] = React.useState(30);
    const router = useRouter();
    const intervalIdRef = React.useRef<number | null>(null);

    // Field-specific validation errors
    const [emailOtpError, setEmailOtpError] = React.useState('');
    const [phoneOtpError, setPhoneOtpError] = React.useState('');
    
    React.useEffect(() => {
        if (timer > 0) {
            const id = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000) as unknown as number;
            
            // Store the interval ID for cleanup
            intervalIdRef.current = id;
        }
        
        return () => {
            if (intervalIdRef.current !== null) {
                clearInterval(intervalIdRef.current);
                intervalIdRef.current = null;
            }
        };
    }, [timer]);

    // Validation functions
    const validateEmailOtp = (value: string): boolean => {
        if (value.length !== 4 || !/^\d+$/.test(value)) {
            setEmailOtpError('Email OTP must be 4 digits');
            return false;
        }
        setEmailOtpError('');
        return true;
    };

    const validatePhoneOtp = (value: string): boolean => {
        if (value.length !== 4 || !/^\d+$/.test(value)) {
            setPhoneOtpError('Phone OTP must be 4 digits');
            return false;
        }
        setPhoneOtpError('');
        return true;
    };

    // Handle text change with validation
    const handleEmailOtpChange = (text: string): void => {
        // Only allow digits
        const digitsOnly = text.replace(/\D/g, '');
        // Limit to 6 digits
        const limitedText = digitsOnly.slice(0, 6);
        setEmailOtp(limitedText);
        if (emailOtpError) validateEmailOtp(limitedText);
    };

    const handlePhoneOtpChange = (text: string): void => {
        // Only allow digits
        const digitsOnly = text.replace(/\D/g, '');
        // Limit to 6 digits
        const limitedText = digitsOnly.slice(0, 6);
        setPhoneOtp(limitedText);
        if (phoneOtpError) validatePhoneOtp(limitedText);
    };

    const handleVerify = async () => {
        // Validate fields
        const isEmailOtpValid = validateEmailOtp(emailOtp);
        const isPhoneOtpValid = validatePhoneOtp(phoneOtp);

        if (!isEmailOtpValid || !isPhoneOtpValid) {
            setError('Please fix the errors in the form');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await apiClient.post('/api/v1/verify-otp', { emailOtp, phoneOtp });
            setSuccess('Verification successful!');

            // Navigate to home after successful verification
            setTimeout(() => {
                router.replace('/(tabs)' as any);
            }, 1500);
        } catch (err: unknown) {
            console.error('Verification failed:', err);
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        setError('');
        setSuccess('');

        try {
            await apiClient.get('/api/v1/resend-otp');
            setSuccess('OTP sent successfully!');
            setTimer(60);
        } catch (err: unknown) {
            console.error('Resend OTP failed:', err);
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setResendLoading(false);
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
                    <Logo size="medium" />

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
                                marginBottom: 16,
                                fontWeight: 'bold',
                                fontFamily: 'System'
                            }}
                        >
                            Verify Your Account
                        </Text>

                        <Text
                            style={{
                                fontSize: 14,
                                color: '#6B7280',
                                marginBottom: 24,
                                fontFamily: 'System'
                            }}
                        >
                            We've sent verification codes to your email and phone number. Please enter them below to verify your account.
                        </Text>

                        {error ? <ErrorMessage message={error} /> : null}

                        {success ? (
                            <View className="bg-green-50 p-3 rounded-lg mb-4 flex-row items-center">
                                <Text className="text-green-600 ml-2 flex-1" style={{ fontFamily: 'System' }}>
                                    {success}
                                </Text>
                            </View>
                        ) : null}

                        <FormInput
                            label="Email Verification Code"
                            value={emailOtp}
                            onChangeText={handleEmailOtpChange}
                            placeholder="Enter 4-digit email OTP"
                            iconName="email-outline"
                            keyboardType="numeric"
                            error={emailOtpError}
                        />

                        <FormInput
                            label="Phone Verification Code"
                            value={phoneOtp}
                            onChangeText={handlePhoneOtpChange}
                            placeholder="Enter 4-digit phone OTP"
                            iconName="phone-outline"
                            keyboardType="numeric"
                            error={phoneOtpError}
                        />

                        <FormButton
                            title="Verify"
                            onPress={handleVerify}
                            loading={loading}
                        />

                        <View className="items-center mb-4">
                            <Text
                                className="text-text-secondary mb-2"
                                style={{ fontFamily: 'System' }}
                            >
                                Didn't receive the code?
                            </Text>
                            {timer > 0 ? (
                                <Text
                                    className="text-primary font-medium"
                                    style={{ fontFamily: 'System' }}
                                >
                                    Resend in {timer} seconds
                                </Text>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleResendOtp}
                                    disabled={resendLoading}
                                >
                                    <Text
                                        className="text-primary font-bold"
                                        style={{ fontFamily: 'System' }}
                                    >
                                        {resendLoading ? 'Sending...' : 'Resend Code'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

