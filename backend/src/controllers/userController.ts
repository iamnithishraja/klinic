import type { Request, Response } from 'express';
import User from '../models/userModel';
import { generateToken } from '../utils/jwt';
import { sendOtp } from '../utils/verification';
import userSchema from '../schemas/userSchema';
import bcrypt from 'bcrypt';
import type { CustomRequest } from '../types/userTypes';
import SuspendedUser from '../models/suspendedUserModel';

const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Register request body:', req.body);
        
        // Validate request body
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ message: 'Request body is required' });
            return;
        }
        
        const { name, email, phone, password, role } = userSchema.parse(req.body);
        console.log('Parsed data:', { name, email, phone, role });
        
        // Check if email is suspended
        const isEmailSuspended = await SuspendedUser.isSuspended(email);
        if (isEmailSuspended) {
            const suspensionDetails = await SuspendedUser.getSuspensionDetails(email);
            res.status(403).json({ 
                message: 'Email address is suspended',
                reason: suspensionDetails?.reason || 'Email suspended by administrator',
                suspendedAt: suspensionDetails?.suspendedAt,
                expiresAt: suspensionDetails?.expiresAt
            });
            return;
        }

        // Check if phone is suspended
        const isPhoneSuspended = await SuspendedUser.isSuspended(undefined, phone);
        if (isPhoneSuspended) {
            const suspensionDetails = await SuspendedUser.getSuspensionDetails(undefined, phone);
            res.status(403).json({ 
                message: 'Phone number is suspended',
                reason: suspensionDetails?.reason || 'Phone suspended by administrator',
                suspendedAt: suspensionDetails?.suspendedAt,
                expiresAt: suspensionDetails?.expiresAt
            });
            return;
        }
        
        // Check if user already exists by email
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }
        
        // Check if user already exists by phone
        const existingUserByPhone = await User.findOne({ phone });
        if (existingUserByPhone) {
            res.status(400).json({ message: 'User with this phone number already exists' });
            return;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');
        
        // Create user
        const user = await User.create({ 
            name, 
            email, 
            phone, 
            password: hashedPassword, 
            role,
            isPhoneEmailVerified: false
        });
        console.log('User created:', user._id);
        
        // Generate token
        const token = generateToken(user._id.toString());
        console.log('Token generated');
        
        // Send OTP (optional - don't fail registration if OTP fails)
        try {
            await sendOtp(email, phone);
            console.log('OTP sent successfully');
        } catch (otpError) {
            console.log('OTP sending failed:', otpError);
            // Continue with registration even if OTP fails
        }
        
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(201).json({ 
            user: userResponse, 
            token,
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle Zod validation errors
        if (error instanceof Error && error.name === 'ZodError') {
            res.status(400).json({ 
                message: 'Validation failed', 
                errors: error.message 
            });
            return;
        }
        
        // Handle MongoDB duplicate key errors
        if (error instanceof Error && error.message.includes('duplicate key')) {
            if (error.message.includes('email')) {
                res.status(400).json({ message: 'User with this email already exists' });
            } else if (error.message.includes('phone')) {
                res.status(400).json({ message: 'User with this phone number already exists' });
            } else {
                res.status(400).json({ message: 'User already exists' });
            }
            return;
        }
        
        // Generic error response
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        // Check if user is suspended
        const isSuspended = await SuspendedUser.isSuspended(email);
        if (isSuspended) {
            const suspensionDetails = await SuspendedUser.getSuspensionDetails(email);
            res.status(403).json({ 
                message: 'Account suspended',
                reason: suspensionDetails?.reason || 'Account suspended by administrator',
                suspendedAt: suspensionDetails?.suspendedAt,
                expiresAt: suspensionDetails?.expiresAt
            });
            return;
        }
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const token = generateToken(user._id.toString());
        user.password = '';
        res.status(200).json({ user, token });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const resendOtp = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(401).json({ message: 'Invalid email or phone' });
            return;
        }
        await sendOtp(user.email, user.phone);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const verifyOtp = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { emailOtp, phoneOtp } = req.body;
        const user = await User.findById(req.user._id).select('+emailOtp +phoneOtp');
        if (!user) {
            res.status(401).json({ message: 'Invalid email or phone' });
            return;
        }
        if (user.emailOtp !== emailOtp || user.phoneOtp !== phoneOtp) {
            res.status(401).json({ message: 'Invalid OTP' });
            return;
        }
        user.isPhoneEmailVerified = true;
        await user.save();
        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}
const getUser = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const changeEmailPhone = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { email, phone } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, { email, phone }, { new: true });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or phone' });
            return;
        }
        await sendOtp(user.email, user.phone);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const updateUserBasicInfo = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { name, email, phone, profilePicture } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, { name, email, phone, profilePicture }, { new: true });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}
export { registerUser, loginUser, resendOtp, getUser, verifyOtp, changeEmailPhone, updateUserBasicInfo }; 