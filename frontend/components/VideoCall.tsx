import React from 'react';
import { Platform } from 'react-native';

interface VideoCallProps {
  channelName: string;
  token: string;
  uid: number;
  onEndCall: () => void;
  userRole: 'doctor' | 'patient';
}

const VideoCall: React.FC<VideoCallProps> = (props) => {
  if (Platform.OS === 'web') {
    // For web platform, use the web-specific implementation
    const VideoCallWeb = require('./VideoCall.web').default;
    return <VideoCallWeb {...props} />;
  } else {
    // For mobile platforms (iOS/Android), use the native implementation
    const VideoCallNative = require('./VideoCall.native').default;
    return <VideoCallNative {...props} />;
  }
};

export default VideoCall; 