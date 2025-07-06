# Video Call Setup Guide

This guide will help you set up the cross-platform video calling system that works on both web and mobile platforms.

## Overview

The video calling system now supports:
- **Web browsers** using Agora Web SDK
- **iOS/Android mobile apps** using React Native Agora SDK

## Prerequisites

1. **Agora.io Account**: You need an Agora.io account and project
2. **Environment Variables**: Proper configuration of Agora credentials
3. **Permissions**: Camera and microphone access on all platforms

## Installation Steps

### 1. Install Dependencies

The following dependencies are already installed:
- `react-native-agora` - For mobile platforms
- `agora-rtc-sdk-ng` - For web platform
- `expo-build-properties` - For web platform configuration

### 2. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# Agora Configuration
EXPO_PUBLIC_AGORA_APP_ID=your-agora-app-id-here
```

Make sure to replace `your-agora-app-id-here` with your actual Agora App ID from your Agora.io dashboard.

### 3. Backend Configuration

Ensure your backend has the following environment variables in `backend/.env`:

```env
# Agora Configuration
AGORA_APP_ID=your-agora-app-id-here
AGORA_APP_CERTIFICATE=your-agora-app-certificate-here
```

## How It Works

### Platform Detection

The system automatically detects the platform and loads the appropriate video call implementation:

```typescript
// VideoCall.tsx (Platform-agnostic wrapper)
if (Platform.OS === 'web') {
  // Uses VideoCall.web.tsx with Agora Web SDK
  const VideoCallWeb = require('./VideoCall.web').default;
  return <VideoCallWeb {...props} />;
} else {
  // Uses VideoCall.native.tsx with React Native Agora SDK
  const VideoCallNative = require('./VideoCall.native').default;
  return <VideoCallNative {...props} />;
}
```

### File Structure

```
components/
├── VideoCall.tsx          # Platform-agnostic wrapper
├── VideoCall.web.tsx      # Web implementation (Agora Web SDK)
├── VideoCall.native.tsx   # Mobile implementation (React Native Agora SDK)
├── VideoCallModal.tsx     # Modal wrapper (unchanged)
└── VideoCallStatus.tsx    # Status component (unchanged)
```

## Platform-Specific Features

### Web Platform
- Uses Agora Web SDK (`agora-rtc-sdk-ng`)
- Supports all modern browsers
- Automatic permission handling
- WebRTC-based video calling

### Mobile Platform
- Uses React Native Agora SDK (`react-native-agora`)
- Native performance
- Camera switching support
- Platform-specific permissions

## Testing

### Web Testing
```bash
npm run web
```

### Mobile Testing
```bash
# iOS
npm run ios

# Android
npm run android
```

## Troubleshooting

### Common Issues

1. **Module Resolution Error (Web)**
   - This should be resolved with the new platform-specific implementation
   - If you still see issues, clear your cache: `npx expo start --clear`

2. **Permission Errors**
   - Ensure camera and microphone permissions are granted
   - Check browser settings for media device access

3. **Token Generation Errors**
   - Verify your Agora App ID and Certificate are correct
   - Check that the backend can generate tokens properly

4. **Connection Issues**
   - Ensure stable internet connection
   - Check firewall settings for WebRTC traffic

### Debug Steps

1. **Check Environment Variables**
   ```bash
   # In frontend directory
   echo $EXPO_PUBLIC_AGORA_APP_ID
   ```

2. **Test Token Generation**
   ```bash
   # Test backend token generation endpoint
   curl -X POST http://localhost:3000/api/v1/video-call/generate-token \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your-jwt-token" \
     -d '{"appointmentId": "test-id", "userRole": "doctor"}'
   ```

3. **Check Browser Console**
   - Open browser dev tools
   - Look for any JavaScript errors
   - Check network tab for failed requests

## Performance Optimization

### Web Platform
- Video quality is optimized for web browsers
- Automatic bandwidth adaptation
- Efficient codec selection (VP8)

### Mobile Platform
- Native performance optimizations
- Hardware acceleration
- Battery usage optimization

## Security Considerations

1. **Token Security**
   - Tokens are generated server-side
   - Short expiration times (1 hour)
   - User authorization checks

2. **Channel Security**
   - Unique channel names per appointment
   - User role validation
   - Access control

## Next Steps

1. **Configure your Agora credentials**
2. **Test on both web and mobile platforms**
3. **Set up proper error handling and logging**
4. **Monitor video call quality and usage**

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify your Agora configuration
3. Test token generation on the backend
4. Ensure proper network connectivity

The system is now ready for cross-platform video calling! 