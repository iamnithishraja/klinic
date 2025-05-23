import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ChangeEmailPhoneModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (email: string, phone: string) => Promise<void>;
    currentEmail: string;
    currentPhone: string;
}

const ChangeEmailPhoneModal = ({
    visible,
    onClose,
    onSubmit,
    currentEmail,
    currentPhone
}: ChangeEmailPhoneModalProps) => {
    const [email, setEmail] = useState(currentEmail);
    const [phone, setPhone] = useState(currentPhone);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validateEmail = (value: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setError('Please enter a valid email address');
            return false;
        }
        return true;
    };

    const validatePhone = (value: string): boolean => {
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(value)) {
            setError('Phone number must be 10 digits');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        setError('');
        
        if (!validateEmail(email) || !validatePhone(phone)) {
            return;
        }

        setLoading(true);
        try {
            await onSubmit(email, phone);
            onClose();
        } catch (err) {
            console.error('Failed to update email/phone:', err);
            setError('Failed to update email/phone. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white w-[90%] max-w-[400px] rounded-2xl p-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-gray-800">
                            Change Email & Phone
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {error ? (
                        <View className="bg-red-50 p-3 rounded-lg mb-4">
                            <Text className="text-red-600">{error}</Text>
                        </View>
                    ) : null}

                    <View className="mb-4">
                        <Text className="text-gray-700 font-medium mb-2">Email Address</Text>
                        <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons
                                name="email-outline"
                                size={22}
                                color="#4F46E5"
                                style={{ marginRight: 8 }}
                            />
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter email address"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                className="flex-1 text-gray-800"
                            />
                        </View>
                    </View>

                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-2">Phone Number</Text>
                        <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons
                                name="phone-outline"
                                size={22}
                                color="#4F46E5"
                                style={{ marginRight: 8 }}
                            />
                            <TextInput
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                                className="flex-1 text-gray-800"
                            />
                        </View>
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={onClose}
                            className="flex-1 border border-gray-300 rounded-xl py-3"
                        >
                            <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-primary rounded-xl py-3"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-center text-white font-medium">Update</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ChangeEmailPhoneModal; 