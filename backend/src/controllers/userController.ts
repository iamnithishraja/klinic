import type { Request, Response } from 'express';
import User from '../models/userModel';
import { generateToken } from '../utils/jwt';
import { sendOtp } from '../utils/verification';
import userSchema from '../schemas/userSchema';
import bcrypt from 'bcrypt';
import type { CustomRequest } from '../types/userTypes';

const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password, role } = userSchema.parse(req.body);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, phone, password: hashedPassword, role });
        const token = generateToken(user._id.toString());
        await sendOtp(email, phone);
        res.status(201).json({ user, token });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
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
export { registerUser, loginUser, resendOtp, getUser, verifyOtp, changeEmailPhone }; 