import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Dimensions, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
  VideoSourceType,
  RtcConnection,
  ConnectionStateType
} from 'react-native-agora';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import VideoCallStatus from './VideoCallStatus';

interface VideoCallProps {
  channelName: string;
  token: string;
  uid: number;
  onEndCall: () => void;
  userRole: 'doctor' | 'patient';
}

const { width, height } = Dimensions.get('window');

const VideoCall: React.FC<VideoCallProps> = ({ 
  channelName, 
  token, 
  uid, 
  onEndCall, 
  userRole 
}) => {
  const [agoraEngineRef, setAgoraEngineRef] = useState<IRtcEngine | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isLocalVideoMuted, setIsLocalVideoMuted] = useState(false);
  const [isLocalAudioMuted, setIsLocalAudioMuted] = useState(false);
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'waiting' | 'connected' | 'disconnected'>('connecting');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Agora App ID - this should be stored in environment variables
  const appId = process.env.EXPO_PUBLIC_AGORA_APP_ID || 'your_agora_app_id';

  useEffect(() => {
    console.log('VideoCall component mounted with props:', {
      channelName,
      token: token ? 'Token provided' : 'No token',
      uid,
      userRole,
      appId: appId !== 'your_agora_app_id' ? 'App ID configured' : 'App ID not configured'
    });
    
    if (appId === 'your_agora_app_id') {
      setInitializationError('Agora App ID is not configured. Please set EXPO_PUBLIC_AGORA_APP_ID in your environment variables.');
      return;
    }

    if (!token) {
      setInitializationError('No token provided for video call');
      return;
    }

    requestPermissions();
    
    return () => {
      if (agoraEngineRef) {
        console.log('Cleaning up Agora engine');
        agoraEngineRef.release();
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      console.log('Requesting camera and microphone permissions...');
      
      // Request camera permission
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      console.log('Camera permission:', cameraPermission.status);
      
      // Request microphone permission
      const audioPermission = await Audio.requestPermissionsAsync();
      console.log('Audio permission:', audioPermission.status);
      
      if (cameraPermission.status === 'granted' && audioPermission.status === 'granted') {
        console.log('All permissions granted, setting up video SDK...');
        setPermissionsGranted(true);
        setupVideoSDKEngine();
      } else {
        console.log('Permissions denied');
        setInitializationError('Camera and microphone permissions are required for video calls');
        Alert.alert(
          'Permissions Required',
          'Please grant camera and microphone permissions to start the video call.',
          [
            { text: 'Cancel', onPress: onEndCall },
            { text: 'Retry', onPress: requestPermissions }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setInitializationError('Failed to request permissions');
    }
  };

  const setupVideoSDKEngine = async () => {
    try {
      console.log('Setting up Agora video SDK...');
      
      // Check if Agora SDK is available
      if (typeof createAgoraRtcEngine !== 'function') {
        throw new Error('Agora SDK not available. Make sure react-native-agora is properly installed and configured.');
      }

      const engine = createAgoraRtcEngine();
      
      if (!engine) {
        throw new Error('Failed to create Agora engine');
      }

      console.log('Initializing Agora engine with App ID:', appId);
      await engine.initialize({ appId });
      setAgoraEngineRef(engine);

      engine.registerEventHandler({
        onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
          console.log('Successfully joined channel:', connection.channelId, 'Elapsed:', elapsed);
          setIsJoined(true);
          setConnectionStatus('waiting');
        },
        onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {
          console.log('Remote user joined:', remoteUid, 'Elapsed:', elapsed);
          setRemoteUid(remoteUid);
          setConnectionStatus('connected');
        },
        onUserOffline: (connection: RtcConnection, remoteUid: number, reason: number) => {
          console.log('Remote user left:', remoteUid, 'Reason:', reason);
          setRemoteUid(null);
          setConnectionStatus('waiting');
        },
        onRemoteVideoStateChanged: (connection: RtcConnection, remoteUid: number, state: number, reason: number) => {
          console.log('Remote video state changed:', { remoteUid, state, reason });
          setIsRemoteVideoMuted(state === 0);
        },
        onError: (error: any) => {
          console.error('Agora error:', error);
          setConnectionStatus('disconnected');
          setInitializationError(`Agora error: ${error.code || 'Unknown error'}`);
        },
        onConnectionStateChanged: (connection: RtcConnection, state: ConnectionStateType, reason: number) => {
          console.log('Connection state changed:', { state, reason });
          if (state === ConnectionStateType.ConnectionStateFailed) {
            setConnectionStatus('disconnected');
            setInitializationError('Connection failed. Please check your internet connection and try again.');
          }
        }
      });

      console.log('Configuring video settings...');
      await engine.enableVideo();
      await engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      
      // Join the channel
      console.log('Joining channel:', channelName, 'with UID:', uid);
      await engine.joinChannel(token, channelName, uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
      
      console.log('Video call setup completed successfully');
      
    } catch (error) {
      console.error('Error setting up video SDK:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setInitializationError(`Failed to setup video call: ${errorMessage}`);
      Alert.alert('Error', `Failed to setup video call: ${errorMessage}`);
    }
  };

  const toggleLocalVideo = async () => {
    if (agoraEngineRef) {
      await agoraEngineRef.muteLocalVideoStream(!isLocalVideoMuted);
      setIsLocalVideoMuted(!isLocalVideoMuted);
    }
  };

  const toggleLocalAudio = async () => {
    if (agoraEngineRef) {
      await agoraEngineRef.muteLocalAudioStream(!isLocalAudioMuted);
      setIsLocalAudioMuted(!isLocalAudioMuted);
    }
  };

  const switchCamera = async () => {
    if (agoraEngineRef) {
      await agoraEngineRef.switchCamera();
    }
  };

  const endCall = async () => {
    try {
      console.log('Ending video call...');
      if (agoraEngineRef) {
        await agoraEngineRef.leaveChannel();
        setIsJoined(false);
        setRemoteUid(null);
        setConnectionStatus('disconnected');
      }
      onEndCall();
    } catch (error) {
      console.error('Error ending call:', error);
      onEndCall();
    }
  };

  const renderLocalVideo = () => (
    <View style={styles.localVideoContainer}>
      <RtcSurfaceView
        style={styles.localVideo}
        canvas={{
          uid: 0,
          sourceType: VideoSourceType.VideoSourceCamera,
        }}
      />
      {isLocalVideoMuted && (
        <View style={styles.mutedOverlay}>
          <FontAwesome name="video-camera" size={24} color="#fff" />
          <Text style={styles.mutedText}>Camera Off</Text>
        </View>
      )}
    </View>
  );

  const renderRemoteVideo = () => {
    if (remoteUid === null) {
      return (
        <VideoCallStatus
          connectionStatus={connectionStatus}
          userRole={userRole}
          remoteUserPresent={false}
        />
      );
    }

    return (
      <View style={styles.remoteVideoContainer}>
        <RtcSurfaceView
          style={styles.remoteVideo}
          canvas={{
            uid: remoteUid,
            sourceType: VideoSourceType.VideoSourceRemote,
          }}
        />
        {isRemoteVideoMuted && (
          <View style={styles.mutedOverlay}>
            <FontAwesome name="user" size={40} color="#fff" />
            <Text style={styles.mutedText}>
              {userRole === 'doctor' ? 'Patient' : 'Doctor'} camera is off
            </Text>
          </View>
        )}
        {/* Status indicator when connected */}
        <VideoCallStatus
          connectionStatus={connectionStatus}
          userRole={userRole}
          remoteUserPresent={true}
        />
      </View>
    );
  };

  // Show error screen if there's an initialization error
  if (initializationError) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-triangle" size={60} color="#ff4444" />
        <Text style={styles.errorText}>{initializationError}</Text>
        <Pressable style={styles.retryButton} onPress={requestPermissions}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={onEndCall}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // Show permissions screen if permissions not granted
  if (!permissionsGranted) {
    return (
      <View style={styles.permissionsContainer}>
        <FontAwesome name="video-camera" size={60} color="#ccc" />
        <Text style={styles.permissionsText}>Camera and microphone access required</Text>
        <Text style={styles.permissionsSubtext}>
          Please grant permissions to start your video consultation
        </Text>
        <Pressable style={styles.permissionsButton} onPress={requestPermissions}>
          <Text style={styles.permissionsButtonText}>Grant Permissions</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main video area */}
      <View style={styles.videoContainer}>
        {renderRemoteVideo()}
        {renderLocalVideo()}
      </View>

      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        <Pressable
          style={[styles.controlButton, isLocalAudioMuted && styles.mutedButton]}
          onPress={toggleLocalAudio}
        >
          <FontAwesome 
            name={isLocalAudioMuted ? "microphone-slash" : "microphone"} 
            size={20} 
            color="#fff" 
          />
        </Pressable>

        <Pressable
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <FontAwesome name="phone" size={20} color="#fff" />
        </Pressable>

        <Pressable
          style={[styles.controlButton, isLocalVideoMuted && styles.mutedButton]}
          onPress={toggleLocalVideo}
        >
          <FontAwesome 
            name={isLocalVideoMuted ? "video-camera" : "video-camera"} 
            size={20} 
            color="#fff" 
          />
        </Pressable>

        <Pressable
          style={styles.controlButton}
          onPress={switchCamera}
        >
          <FontAwesome name="refresh" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* User role indicator */}
      <View style={styles.roleIndicator}>
        <Text style={styles.roleText}>
          {userRole === 'doctor' ? 'Doctor' : 'Patient'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  remoteVideo: {
    flex: 1,
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  mutedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#ff4444',
  },
  mutedButton: {
    backgroundColor: '#666',
  },
  roleIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  permissionsText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  permissionsSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VideoCall; 