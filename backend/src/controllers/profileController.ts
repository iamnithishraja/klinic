import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import { UserProfile, DoctorProfile, LaboratoryProfile, DeliveryBoyProfile } from '../models/profileModel';
import mongoose from 'mongoose';
import { generateUploadUrl } from '../utils/fileUpload';

// Create or update user profile
const createUpdateUserProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { _id, profilePicture, age, gender, medicalHistory, medicalHistoryPdf, address } = req.body;
        
        const userId = _id || req.user._id;
        
        const profileData = {
            user: userId,
            profilePicture,
            age,
            gender,
            medicalHistory,
            medicalHistoryPdf,
            address,
            updatedAt: new Date()
        };
        
        // Find and update if exists, otherwise create new
        let userProfile;
        if (_id) {
            userProfile = await UserProfile.findByIdAndUpdate(_id, profileData, { new: true });
        } else {
            // Check if profile already exists for this user
            userProfile = await UserProfile.findOne({ user: req.user._id });
            
            if (userProfile) {
                // Update existing profile
                userProfile = await UserProfile.findByIdAndUpdate(userProfile._id, profileData, { new: true });
            } else {
                // Create new profile
                userProfile = await UserProfile.create(profileData);
            }
        }
        
        res.status(200).json(userProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get profile based on user role
const getProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const { role } = req.user;
        
        let profile = null;
        
        // Get profile based on user role
        switch (role) {
            case 'user':
                profile = await UserProfile.findOne({ user: userId });
                break;
            case 'doctor':
                profile = await DoctorProfile.findOne({ user: userId });
                break;
            case 'laboratory':
                profile = await LaboratoryProfile.findOne({ user: userId });
                break;
            case 'deliveryboy':
                profile = await DeliveryBoyProfile.findOne({ user: userId });
                break;
            default:
                res.status(400).json({ message: 'Invalid user role' });
                return;
        }
        
        if (!profile) {
            res.status(404).json({ message: 'Profile not found' });
            return;
        }
        
        res.status(200).json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create or update doctor profile
const createUpdateDoctorProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {
            _id, description, experience, specializations, qualifications, 
            consultationFee, profilePicture, age, gender, consultationType,
            availableSlots, availableDays, isAvailable, clinicName, clinicPhone,
            clinicEmail, clinicWebsite, clinicImages, clinicAddress
        } = req.body;
        
        const userId = _id || req.user._id;
        
        const profileData = {
            user: userId,
            description,
            experience,
            specializations,
            qualifications,
            consultationFee,
            profilePicture,
            age,
            gender,
            consultationType,
            availableSlots,
            availableDays,
            isAvailable,
            clinicName,
            clinicPhone,
            clinicEmail,
            clinicWebsite,
            clinicImages,
            clinicAddress,
            updatedAt: new Date()
        };
        
        // Find and update if exists, otherwise create new
        let doctorProfile;
        if (_id) {
            doctorProfile = await DoctorProfile.findByIdAndUpdate(_id, profileData, { new: true });
        } else {
            // Check if profile already exists for this user
            doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
            
            if (doctorProfile) {
                // Update existing profile
                doctorProfile = await DoctorProfile.findByIdAndUpdate(doctorProfile._id, profileData, { new: true });
            } else {
                // Create new profile
                doctorProfile = await DoctorProfile.create(profileData);
            }
        }
        
        res.status(200).json(doctorProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create or update laboratory profile
const createUpdateLabProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {
            _id, laboratoryName, laboratoryAddress, laboratoryPhone, 
            laboratoryEmail, laboratoryWebsite, laboratoryServices
        } = req.body;
        
        const userId = _id || req.user._id;
        
        const profileData = {
            user: userId,
            laboratoryName,
            laboratoryAddress,
            laboratoryPhone,
            laboratoryEmail,
            laboratoryWebsite,
            laboratoryServices,
            updatedAt: new Date()
        };
        
        // Find and update if exists, otherwise create new
        let labProfile;
        if (_id) {
            labProfile = await LaboratoryProfile.findByIdAndUpdate(_id, profileData, { new: true });
        } else {
            // Check if profile already exists for this user
            labProfile = await LaboratoryProfile.findOne({ user: req.user._id });
            
            if (labProfile) {
                // Update existing profile
                labProfile = await LaboratoryProfile.findByIdAndUpdate(labProfile._id, profileData, { new: true });
            } else {
                // Create new profile
                labProfile = await LaboratoryProfile.create(profileData);
            }
        }
        
        res.status(200).json(labProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create or update delivery boy profile
const createUpdateDeliveryProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { _id, profilePicture, age, gender, delivarablePinCodes } = req.body;
        
        const userId = _id || req.user._id;
        
        const profileData = {
            user: userId,
            profilePicture,
            age,
            gender,
            delivarablePinCodes,
            updatedAt: new Date()
        };
        
        // Find and update if exists, otherwise create new
        let deliveryProfile;
        if (_id) {
            deliveryProfile = await DeliveryBoyProfile.findByIdAndUpdate(_id, profileData, { new: true });
        } else {
            // Check if profile already exists for this user
            deliveryProfile = await DeliveryBoyProfile.findOne({ user: req.user._id });
            
            if (deliveryProfile) {
                // Update existing profile
                deliveryProfile = await DeliveryBoyProfile.findByIdAndUpdate(deliveryProfile._id, profileData, { new: true });
            } else {
                // Create new profile
                deliveryProfile = await DeliveryBoyProfile.create(profileData);
            }
        }
        
        res.status(200).json(deliveryProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Request file upload URL
const getUploadUrl = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { fileType, fileName } = req.body;
        
        if (!fileType || !fileName) {
            res.status(400).json({ message: 'File type and name are required' });
            return;
        }
        
        // Generate a presigned URL for uploading
        const uploadUrl = await generateUploadUrl(fileType, fileName);
        
        res.status(200).json({ uploadUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export {
    createUpdateUserProfile,
    getProfile,
    createUpdateDoctorProfile,
    createUpdateLabProfile,
    createUpdateDeliveryProfile,
    getUploadUrl
}; 