import type { Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import DoctorAppointment from "../models/doctorAppointments";
import { RtcTokenBuilder, RtcRole } from "agora-token";

// Agora configuration - these should be stored in environment variables
const AGORA_APP_ID = process.env.AGORA_APP_ID || '';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';

// Generate Agora token for video call
const generateVideoCallToken = async (req: CustomRequest, res: Response) => {
    try {
        const { appointmentId, userRole } = req.body;
        const userId = req.user._id;

        console.log('Generate video call token request:', { appointmentId, userRole, userId });

        // Check if Agora credentials are configured
        if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
            console.error('Agora credentials not configured');
            return res.status(500).json({ 
                success: false, 
                message: "Video call service is not configured. Please contact support." 
            });
        }

        // Validate required fields
        if (!appointmentId || !userRole) {
            console.error('Missing required fields:', { appointmentId, userRole });
            return res.status(400).json({ 
                success: false, 
                message: "Appointment ID and user role are required" 
            });
        }

        // Check if user role is valid
        if (!['doctor', 'patient'].includes(userRole)) {
            console.error('Invalid user role:', userRole);
            return res.status(400).json({ 
                success: false, 
                message: "Invalid user role" 
            });
        }

        // Find the appointment
        const appointment = await DoctorAppointment.findById(appointmentId)
            .populate('doctor', 'name email')
            .populate('patient', 'name email');

        if (!appointment) {
            return res.status(404).json({ 
                success: false, 
                message: "Appointment not found" 
            });
        }

        // Check if appointment has required data
        if (!appointment.doctor || !appointment.patient) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid appointment data" 
            });
        }

        // Check if the user is authorized to join this call
        // For doctors: user should have 'doctor' role and be the appointed doctor
        // For patients: user should have 'user' role and be the patient in appointment
        const isAuthorizedDoctor = (userRole === 'doctor' && 
                                   req.user.role === 'doctor' && 
                                   appointment.doctor._id.toString() === userId.toString());
        
        const isAuthorizedPatient = (userRole === 'patient' && 
                                    req.user.role === 'user' && 
                                    appointment.patient._id.toString() === userId.toString());

        if (!isAuthorizedDoctor && !isAuthorizedPatient) {
            return res.status(403).json({ 
                success: false, 
                message: "You are not authorized to join this video call" 
            });
        }

        // Check if the appointment is for online consultation
        if (appointment.consultationType !== 'online') {
            return res.status(400).json({ 
                success: false, 
                message: "This appointment is not for online consultation" 
            });
        }

        // Generate channel name based on appointment ID
        const channelName = `appointment_${appointmentId}`;

        // Generate unique user ID for Agora
        const uid = userRole === 'doctor' ? 1 : 2; // Doctor = 1, Patient = 2

        // Token expiration time (1 hour)
        const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 3600;

        // Generate token
        console.log('Generating Agora token for:', { channelName, uid, role: RtcRole.PUBLISHER });
        const token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            uid,
            RtcRole.PUBLISHER,
            expirationTimeInSeconds,
            expirationTimeInSeconds
        );

        if (!token) {
            console.error('Failed to generate Agora token');
            return res.status(500).json({ 
                success: false, 
                message: "Failed to generate video call token" 
            });
        }

        // Update appointment status to indicate video call session started
        await DoctorAppointment.findByIdAndUpdate(appointmentId, {
            $set: {
                videoCallStarted: true,
                videoCallStartTime: new Date()
            }
        });
        
        console.log('Video call token generated successfully:', {
            channelName,
            uid,
            appId: AGORA_APP_ID,
            expirationTime: expirationTimeInSeconds,
            tokenLength: token.length
        });
        
        res.status(200).json({
            success: true,
            channelName,
            token,
            uid,
            appId: AGORA_APP_ID,
            expirationTime: expirationTimeInSeconds
        });
    } catch (error) {
        console.error('Error generating video call token:', error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to generate video call token" 
        });
    }
};

// End video call
const endVideoCall = async (req: CustomRequest, res: Response) => {
    try {
        const { appointmentId, userRole } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!appointmentId || !userRole) {
            return res.status(400).json({ 
                success: false, 
                message: "Appointment ID and user role are required" 
            });
        }

        // Find the appointment
        const appointment = await DoctorAppointment.findById(appointmentId)
            .populate('doctor', '_id')
            .populate('patient', '_id');

        if (!appointment) {
            return res.status(404).json({ 
                success: false, 
                message: "Appointment not found" 
            });
        }

        // Check if appointment has required data
        if (!appointment.doctor || !appointment.patient) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid appointment data" 
            });
        }

        // Check if the user is authorized
        const isAuthorized = (userRole === 'doctor' && appointment.doctor._id.toString() === userId.toString()) ||
                            (userRole === 'patient' && appointment.patient._id.toString() === userId.toString());

        if (!isAuthorized) {
            return res.status(403).json({ 
                success: false, 
                message: "You are not authorized to end this video call" 
            });
        }

        // Update appointment to mark video call as ended
        await DoctorAppointment.findByIdAndUpdate(appointmentId, {
            $set: {
                videoCallEnded: true,
                videoCallEndTime: new Date()
            }
        });

        res.status(200).json({
            success: true,
            message: "Video call ended successfully"
        });
    } catch (error) {
        console.error('Error ending video call:', error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to end video call" 
        });
    }
};

// Get video call history
const getVideoCallHistory = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const { userRole } = req.query;

        if (!userRole || !['doctor', 'patient'].includes(userRole as string)) {
            return res.status(400).json({ 
                success: false, 
                message: "Valid user role is required" 
            });
        }

        const query = userRole === 'doctor' 
            ? { doctor: userId, consultationType: 'online', videoCallStarted: true }
            : { patient: userId, consultationType: 'online', videoCallStarted: true };

        const videoCallHistory = await DoctorAppointment.find(query)
            .populate('doctor', 'name email')
            .populate('patient', 'name email')
            .sort({ videoCallStartTime: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            history: videoCallHistory
        });
    } catch (error) {
        console.error('Error fetching video call history:', error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch video call history" 
        });
    }
};

export { 
    generateVideoCallToken, 
    endVideoCall, 
    getVideoCallHistory 
}; 