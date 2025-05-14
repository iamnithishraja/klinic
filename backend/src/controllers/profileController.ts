import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import { UserProfile, DoctorProfile, LaboratoryProfile, DeliveryBoyProfile } from '../models/profileModel';
import mongoose from 'mongoose';
import { generateUploadUrlProfile, deleteFileFromR2 } from '../utils/fileUpload';

// Create or update user profile
const createUpdateUserProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { profilePicture, age, gender, medicalHistory, medicalHistoryPdf, address } = req.body;

        const userId = req.user._id;

        // Check if profile already exists for this user
        const existingProfile = await UserProfile.findOne({ user: userId });

        // Delete existing medical history PDF if a new one is provided
        if (existingProfile?.medicalHistoryPdf && medicalHistoryPdf && existingProfile.medicalHistoryPdf !== medicalHistoryPdf) {
            await deleteFileFromR2(existingProfile.medicalHistoryPdf);
        }

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

        let userProfile;
        if (existingProfile) {
            // Update existing profile
            userProfile = await UserProfile.findByIdAndUpdate(existingProfile._id, profileData, { new: true });
        } else {
            // Create new profile
            userProfile = await UserProfile.create(profileData);
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
            description, experience, specializations, qualifications,
            consultationFee, profilePicture, age, gender, consultationType,
            availableSlots, availableDays, isAvailable, clinicName, clinicPhone,
            clinicEmail, clinicWebsite, clinicImages, clinicAddress
        } = req.body;

        const userId = req.user._id;

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

        // Check if profile already exists for this user
        const existingProfile = await DoctorProfile.findOne({ user: userId });

        let doctorProfile;
        if (existingProfile) {
            // Update existing profile
            doctorProfile = await DoctorProfile.findByIdAndUpdate(existingProfile._id, profileData, { new: true });
        } else {
            // Create new profile
            doctorProfile = await DoctorProfile.create(profileData);
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
            laboratoryName, laboratoryAddress, laboratoryPhone,
            laboratoryEmail, laboratoryWebsite, laboratoryServices
        } = req.body;

        const userId = req.user._id;

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

        // Check if profile already exists for this user
        const existingProfile = await LaboratoryProfile.findOne({ user: userId });

        let labProfile;
        if (existingProfile) {
            // Update existing profile
            labProfile = await LaboratoryProfile.findByIdAndUpdate(existingProfile._id, profileData, { new: true });
        } else {
            // Create new profile
            labProfile = await LaboratoryProfile.create(profileData);
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
        const { profilePicture, age, gender, delivarablePinCodes } = req.body;

        const userId = req.user._id;

        const profileData = {
            user: userId,
            profilePicture,
            age,
            gender,
            delivarablePinCodes,
            updatedAt: new Date()
        };

        // Check if profile already exists for this user
        const existingProfile = await DeliveryBoyProfile.findOne({ user: userId });

        let deliveryProfile;
        if (existingProfile) {
            // Update existing profile
            deliveryProfile = await DeliveryBoyProfile.findByIdAndUpdate(existingProfile._id, profileData, { new: true });
        } else {
            // Create new profile
            deliveryProfile = await DeliveryBoyProfile.create(profileData);
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
        const uploadUrl = await generateUploadUrlProfile(fileType, fileName, req.user.role, req.user._id.toString());

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