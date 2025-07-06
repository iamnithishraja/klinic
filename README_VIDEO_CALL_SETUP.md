# Video Call Setup Guide

This guide will help you set up the video call feature in the Klinic application.

## Prerequisites

1. **Agora Account**: You need an Agora account to use the video call feature
2. **Agora App**: Create an Agora app in your dashboard
3. **Environment Variables**: Proper configuration of Agora credentials

## Setup Steps

### 1. Create Agora Account and App

1. Go to [Agora Console](https://console.agora.io/)
2. Sign up or log in to your account
3. Create a new project
4. Get your App ID and App Certificate from the project dashboard

### 2. Configure Backend Environment Variables

Create a `.env` file in the `backend` directory with the following:

```env
# Agora Configuration
AGORA_APP_ID=your_actual_agora_app_id
AGORA_APP_CERTIFICATE=your_actual_agora_app_certificate

# Other existing environment variables
MONGODB_URI=mongodb://localhost:27017/klinic
JWT_SECRET=your-jwt-secret-key
RAZORPAY_KEYID=your-razorpay-keyid
RAZORPAY_API_SECRET=your-razorpay-api-secret
PORT=3000
NODE_ENV=development
```

### 3. Configure Frontend Environment Variables

Create a `.env` file in the `frontend` directory with the following:

```env
# Agora Configuration
EXPO_PUBLIC_AGORA_APP_ID=your_actual_agora_app_id

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 4. Install Dependencies

The required dependencies should already be installed, but if you need to install them manually:

**Backend:**
```bash
cd backend
npm install agora-token
```

**Frontend:**
```bash
cd frontend
npm install react-native-agora expo-camera expo-av
```

### 5. Restart the Application

After setting up the environment variables, restart both the backend and frontend servers:

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npx expo start
```

## Troubleshooting

### Issue: "Connecting to consultation..." stuck

**Possible causes and solutions:**

1. **Missing Agora App ID**
   - Check that `AGORA_APP_ID` is set in backend `.env`
   - Check that `EXPO_PUBLIC_AGORA_APP_ID` is set in frontend `.env`
   - Restart both servers after adding environment variables

2. **Missing Agora App Certificate**
   - Check that `AGORA_APP_CERTIFICATE` is set in backend `.env`
   - This is required for token generation

3. **Invalid Agora Credentials**
   - Verify your App ID and Certificate are correct
   - Check for any extra spaces or special characters

4. **Permission Issues**
   - Grant camera and microphone permissions when prompted
   - Check device settings if permissions were previously denied

5. **Network Issues**
   - Check internet connection
   - Verify backend is running and accessible
   - Check if there are firewall restrictions

### Issue: "Camera and microphone access required"

**Solutions:**
1. Grant permissions when prompted
2. For Android: Check app permissions in device settings
3. For iOS: Check app permissions in device settings
4. Restart the app after granting permissions

### Issue: Token generation fails

**Solutions:**
1. Check backend logs for specific error messages
2. Verify Agora credentials are correctly configured
3. Check if the appointment exists and user is authorized
4. Verify the appointment is set for online consultation

## Testing

### 1. Check Backend Configuration

You can test if your backend is properly configured by checking the logs when starting the server. Look for:
- No errors about missing Agora credentials
- Successful database connection
- Server starting on the correct port

### 2. Test Token Generation

You can test token generation by making a POST request to `/api/v1/video-call/generate-token` with:
```json
{
  "appointmentId": "your_appointment_id",
  "userRole": "doctor"
}
```

### 3. Check Frontend Configuration

In the video call screen, check the console logs for:
- "App ID configured" message
- "Token provided" message
- "All permissions granted" message

## Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Agora App ID is not configured" | Missing EXPO_PUBLIC_AGORA_APP_ID | Add to frontend .env file |
| "Video call service is not configured" | Missing backend Agora credentials | Add to backend .env file |
| "No token provided for video call" | Backend token generation failed | Check backend logs and credentials |
| "Failed to create Agora engine" | Agora SDK initialization failed | Check App ID and SDK installation |

## Additional Notes

1. **Testing with Multiple Users**: To test the video call feature, you need two devices or users with different roles (doctor and patient)

2. **Production Deployment**: 
   - Use secure environment variable management
   - Consider using Agora's token server for production
   - Implement proper error monitoring

3. **Performance**: 
   - Video calls require good internet connection
   - Consider implementing network quality indicators
   - Add bandwidth optimization for poor connections

## Support

If you continue to experience issues:
1. Check the browser/app console for error messages
2. Check the backend server logs
3. Verify all environment variables are correctly set
4. Test with a simple Agora sample app to verify credentials

For Agora-specific issues, consult the [Agora Documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk). 