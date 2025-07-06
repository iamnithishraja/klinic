import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface VideoCallStatusProps {
  connectionStatus: 'connecting' | 'waiting' | 'connected' | 'disconnected';
  userRole: 'doctor' | 'patient';
  remoteUserPresent: boolean;
}

const VideoCallStatus: React.FC<VideoCallStatusProps> = ({
  connectionStatus,
  userRole,
  remoteUserPresent
}) => {
  const getStatusMessage = () => {
    const otherUserRole = userRole === 'doctor' ? 'patient' : 'doctor';
    
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to consultation...';
      case 'waiting':
        return `Waiting for ${otherUserRole} to join...`;
      case 'connected':
        return `Connected with ${otherUserRole}`;
      case 'disconnected':
        return 'Connection lost. Please try again.';
      default:
        return `Waiting for ${otherUserRole}...`;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#10B981';
      case 'waiting':
        return '#F59E0B';
      case 'connecting':
        return '#3B82F6';
      case 'disconnected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getIconName = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'check-circle';
      case 'waiting':
        return 'clock-o';
      case 'connecting':
        return 'spinner';
      case 'disconnected':
        return 'exclamation-triangle';
      default:
        return 'clock-o';
    }
  };

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      <View style={styles.statusIndicator}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>
          {connectionStatus === 'connected' ? 'Connected' : 
           connectionStatus === 'waiting' ? 'Waiting' : 
           connectionStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
        </Text>
      </View>

      {/* Main status message */}
      {!remoteUserPresent && (
        <View style={styles.messageContainer}>
          <FontAwesome 
            name={getIconName()} 
            size={60} 
            color="#ccc" 
          />
          <Text style={styles.waitingText}>
            {getStatusMessage()}
          </Text>
          {connectionStatus === 'waiting' && (
            <Text style={styles.subtitleText}>
              The {userRole === 'doctor' ? 'patient' : 'doctor'} will appear here when they join
            </Text>
          )}
          {connectionStatus === 'connecting' && (
            <Text style={styles.subtitleText}>
              Please wait while we establish the connection
            </Text>
          )}
          {connectionStatus === 'disconnected' && (
            <Text style={styles.subtitleText}>
              Check your internet connection and try again
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
  },
  waitingText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  subtitleText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
});

export default VideoCallStatus; 