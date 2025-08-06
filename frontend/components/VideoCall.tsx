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
  // Platform detection to use the appropriate video call implementation
  if (Platform.OS === 'web') {
    // Use web implementation
    const VideoCallWeb = require('./VideoCall.web').default;
    return <VideoCallWeb {...props} />;
      } else {
    // Use native implementation
    const VideoCallNative = require('./VideoCall.native').default;
    return <VideoCallNative {...props} />;
  }
};

export default VideoCall; 