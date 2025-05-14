import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import { UserProfile, DoctorProfile, LaboratoryProfile, DeliveryBoyProfile } from '../models/profileModel';
import mongoose from 'mongoose';
import { generateUploadUrlProfile, deleteFileFromR2 } from '../utils/fileUpload';
import { getCities, getQualifications, getSpecializations } from '../utils/selectors';

// Create or update user profile
const createUpdateUserProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { profilePicture, age, gender, medicalHistory, medicalHistoryPdf, address, city } = req.body;

        const userId = req.user._id;

        // Check if profile already exists for this user
        const existingProfile = await UserProfile.findOne({ user: userId });

        // Delete existing medical history PDF if a new one is provided
        if (existingProfile?.medicalHistoryPdf && medicalHistoryPdf && existingProfile.medicalHistoryPdf !== medicalHistoryPdf) {
            await deleteFileFromR2(existingProfile.medicalHistoryPdf);
        }

        // Create initial profile data object
        const profileData: any = {
            user: userId,
            updatedAt: new Date()
        };

        // Add fields to profileData only if they are defined
        if (profilePicture !== undefined && profilePicture !== '') profileData.profilePicture = profilePicture;
        if (age !== undefined) profileData.age = age;
        if (gender !== undefined && gender !== '') profileData.gender = gender;
        if (medicalHistory !== undefined) profileData.medicalHistory = medicalHistory;
        if (medicalHistoryPdf !== undefined && medicalHistoryPdf !== '') profileData.medicalHistoryPdf = medicalHistoryPdf;
        if (address !== undefined && address !== '') profileData.address = address;
        if (city !== undefined && city !== '') profileData.city = city;

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
        const availableCities = getCities();
        const availableSpecializations = getSpecializations();
        const availableQualifications = getQualifications();
        if (role === 'doctor') {
            res.status(200).json({ profile, availableCities, availableSpecializations, availableQualifications });
        } else {
            res.status(200).json({ profile, availableCities });
        }
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
            consultationFee, age, gender, consultationType,
            availableSlots, availableDays, isAvailable, clinicName, clinicPhone,
            clinicEmail, clinicWebsite, coverImage, clinicAddress, city
        } = req.body;

        const userId = req.user._id;

        // Create initial profile data object
        const profileData: any = {
            user: userId,
            updatedAt: new Date()
        };

        // Add fields to profileData only if they are defined
        if (description !== undefined && description !== '') profileData.description = description;
        if (experience !== undefined) profileData.experience = experience;
        if (specializations !== undefined && Array.isArray(specializations) && specializations.length > 0) profileData.specializations = specializations;
        if (qualifications !== undefined && Array.isArray(qualifications) && qualifications.length > 0) profileData.qualifications = qualifications;
        if (consultationFee !== undefined) profileData.consultationFee = consultationFee;
        if (age !== undefined) profileData.age = age;
        if (gender !== undefined && gender !== '') profileData.gender = gender;
        if (consultationType !== undefined && consultationType !== '') profileData.consultationType = consultationType;
        if (availableSlots !== undefined && Array.isArray(availableSlots) && availableSlots.length > 0) profileData.availableSlots = availableSlots;
        if (availableDays !== undefined && Array.isArray(availableDays) && availableDays.length > 0) profileData.availableDays = availableDays;
        if (isAvailable !== undefined) profileData.isAvailable = isAvailable;
        if (clinicName !== undefined && clinicName !== '') profileData.clinicName = clinicName;
        if (clinicPhone !== undefined && clinicPhone !== '') profileData.clinicPhone = clinicPhone;
        if (clinicEmail !== undefined && clinicEmail !== '') profileData.clinicEmail = clinicEmail;
        if (clinicWebsite !== undefined && clinicWebsite !== '') profileData.clinicWebsite = clinicWebsite;
        if (coverImage !== undefined && coverImage !== '') profileData.coverImage = coverImage;
        if (clinicAddress !== undefined && clinicAddress !== '') profileData.clinicAddress = clinicAddress;
        if (city !== undefined && city !== '') profileData.city = city;

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
            laboratoryEmail, laboratoryWebsite, laboratoryServices, city
        } = req.body;

        const userId = req.user._id;

        // Create initial profile data object
        const profileData: any = {
            user: userId,
            updatedAt: new Date()
        };

        // Add fields to profileData only if they are defined
        if (laboratoryName !== undefined && laboratoryName !== '') profileData.laboratoryName = laboratoryName;
        if (laboratoryAddress !== undefined && laboratoryAddress !== '') profileData.laboratoryAddress = laboratoryAddress;
        if (laboratoryPhone !== undefined && laboratoryPhone !== '') profileData.laboratoryPhone = laboratoryPhone;
        if (laboratoryEmail !== undefined && laboratoryEmail !== '') profileData.laboratoryEmail = laboratoryEmail;
        if (laboratoryWebsite !== undefined && laboratoryWebsite !== '') profileData.laboratoryWebsite = laboratoryWebsite;
        if (laboratoryServices !== undefined && Array.isArray(laboratoryServices) && laboratoryServices.length > 0) 
            profileData.laboratoryServices = laboratoryServices;
        if (city !== undefined && city !== '') profileData.city = city;

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

        // Create initial profile data object
        const profileData: any = {
            user: userId,
            updatedAt: new Date()
        };

        // Add fields to profileData only if they are defined
        if (profilePicture !== undefined && profilePicture !== '') profileData.profilePicture = profilePicture;
        if (age !== undefined) profileData.age = age;
        if (gender !== undefined && gender !== '') profileData.gender = gender;
        if (delivarablePinCodes !== undefined && Array.isArray(delivarablePinCodes) && delivarablePinCodes.length > 0)
            profileData.delivarablePinCodes = delivarablePinCodes;

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