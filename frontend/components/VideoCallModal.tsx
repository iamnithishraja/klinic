import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Alert, StatusBar, Platform } from 'react-native';
import VideoCall from './VideoCall';
import apiClient from '@/api/client';

interface VideoCallModalProps {
  visible: boolean;
  onClose: () => void;
  appointmentId: string;
  userRole: 'doctor' | 'patient';
  appointmentData?: {
    doctorName?: string;
    patientName?: string;
    appointmentTime?: string;
  };
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  visible,
  onClose,
  appointmentId,
  userRole,
  appointmentData
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [callData, setCallData] = useState<{
    channelName: string;
    token: string;
    uid: number;
  } | null>(null);

  useEffect(() => {
    if (visible && appointmentId) {
      initializeCall();
    }
  }, [visible, appointmentId]);

  const initializeCall = async () => {
    try {
      setIsLoading(true);
      
      // Get Agora token from backend
      const response = await apiClient.post('/api/v1/video-call/generate-token', {
        appointmentId,
        userRole
      });

      if (response.data.success) {
        setCallData({
          channelName: response.data.channelName,
          token: response.data.token,
          uid: response.data.uid
        });
      } else {
        throw new Error(response.data.message || 'Failed to generate video call token');
      }
    } catch (error: any) {
      console.error('Error initializing video call:', error);
      Alert.alert(
        'Connection Error',
        error.response?.data?.message || 'Failed to connect to video call. Please try again.',
        [{ text: 'OK', onPress: onClose }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async () => {
    try {
      // Notify backend that call has ended
      await apiClient.post('/api/v1/video-call/end-call', {
        appointmentId,
        userRole
      });
    } catch (error) {
      console.error('Error ending call:', error);
    }
    
    onClose();
  };

  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Connecting to video call...</Text>
      <Text style={styles.loadingSubtext}>
        {userRole === 'doctor' 
          ? `Starting consultation with ${appointmentData?.patientName || 'patient'}`
          : `Joining consultation with Dr. ${appointmentData?.doctorName || 'doctor'}`
        }
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {isLoading ? (
        renderLoadingScreen()
      ) : callData ? (
        <VideoCall
          channelName={callData.channelName}
          token={callData.token}
          uid={callData.uid}
          onEndCall={handleEndCall}
          userRole={userRole}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to connect to video call</Text>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default VideoCallModal; 