import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import { UserProfile, DoctorProfile, LaboratoryProfile, DeliveryBoyProfile } from '../models/profileModel';
import mongoose from 'mongoose';
import { generateUploadUrlProfile, deleteFileFromR2 } from '../utils/fileUpload';
import { getCategoriesTestType, getCities, getQualifications, getSpecializations } from '../utils/selectors';

// Create or update user profile
const createUpdateUserProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { profilePicture, age, gender, medicalHistory, medicalHistoryPdfs, address, city } = req.body;

        const userId = req.user._id;

        // Check if profile already exists for this user
        let existingProfile = await UserProfile.findOne({ user: userId });
        if (req.user.role === "deliverypartner") {
            existingProfile = await DeliveryBoyProfile.findOne({ user: userId });
        }
        // Delete existing medical history PDF if a new one is provided
        if (existingProfile?.medicalHistoryPdfs && medicalHistoryPdfs && existingProfile.medicalHistoryPdfs !== medicalHistoryPdfs) {
            for (const pdf of existingProfile.medicalHistoryPdfs) {
                await deleteFileFromR2(pdf);
            }
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
        if (medicalHistoryPdfs !== undefined && medicalHistoryPdfs !== '' && medicalHistoryPdfs.length > 0) profileData.medicalHistoryPdfs = medicalHistoryPdfs;
        if (address !== undefined && address !== '') profileData.address = address;
        if (city !== undefined && city !== '') profileData.city = city;

        let userProfile;
        if (req.user.role === "user") {
            if (existingProfile) {
                // Update existing profile
                userProfile = await UserProfile.findByIdAndUpdate(existingProfile._id, profileData, { new: true });
            } else {
                // Create new profile
                userProfile = await UserProfile.create(profileData);
            }
        } else if (req.user.role === "deliverypartner") {
            if (existingProfile) {
                // Update existing profile
                userProfile = await DeliveryBoyProfile.findByIdAndUpdate(existingProfile._id, profileData, { new: true });
            } else {
                // Create new profile
                userProfile = await DeliveryBoyProfile.create(profileData);
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
            case 'deliverypartner':
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
        const availableLabServiceCategories = getCategoriesTestType();
        if (role === 'doctor') {
            res.status(200).json({ profile, availableCities, availableSpecializations, availableQualifications });
        } else if (role === 'laboratory') {
            res.status(200).json({ profile, availableCities, availableLabServiceCategories });
        }
        else {
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
            clinicEmail, clinicWebsite, coverImage, clinicAddress, city, googleMapsLink
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

        // Handle clinic address and Google Maps link
        if (clinicAddress !== undefined || googleMapsLink !== undefined) {
            profileData.clinicAddress = profileData.clinicAddress || {};

            if (clinicAddress !== undefined) {
                // Check if clinicAddress is an object or a string
                if (typeof clinicAddress === 'object' && clinicAddress !== null) {
                    // It's an object, extract its properties
                    if (clinicAddress.address !== undefined) {
                        profileData.clinicAddress.address = clinicAddress.address;
                    }
                    if (clinicAddress.pinCode !== undefined) {
                        profileData.clinicAddress.pinCode = clinicAddress.pinCode;
                    }
                    if (clinicAddress.googleMapsLink !== undefined) {
                        profileData.clinicAddress.googleMapsLink = clinicAddress.googleMapsLink;
                    }
                    if (clinicAddress.latitude !== undefined) {
                        profileData.clinicAddress.latitude = clinicAddress.latitude;
                    }
                    if (clinicAddress.longitude !== undefined) {
                        profileData.clinicAddress.longitude = clinicAddress.longitude;
                    }
                } else if (clinicAddress !== '') {
                    // It's a string, assign it directly to address
                    profileData.clinicAddress.address = clinicAddress;
                }
            }

            if (googleMapsLink !== undefined && googleMapsLink !== '') {
                profileData.clinicAddress.googleMapsLink = googleMapsLink;
            }
        }

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
const createUpdateLaboratoryProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {
            laboratoryName, laboratoryPhone, laboratoryEmail, laboratoryWebsite,
            laboratoryAddress, city, laboratoryServices, coverImage
        } = req.body;
        

        const userId = req.user._id;

        // Create initial profile data object
        const profileData: any = {
            user: userId,
            updatedAt: new Date()
        };

        // Add fields to profileData only if they are defined
        if (laboratoryName !== undefined && laboratoryName !== '') profileData.laboratoryName = laboratoryName;
        if (laboratoryPhone !== undefined && laboratoryPhone !== '') profileData.laboratoryPhone = laboratoryPhone;
        if (laboratoryEmail !== undefined && laboratoryEmail !== '') profileData.laboratoryEmail = laboratoryEmail;
        if (laboratoryWebsite !== undefined && laboratoryWebsite !== '') profileData.laboratoryWebsite = laboratoryWebsite;
        if (coverImage !== undefined && coverImage !== '') profileData.coverImage = coverImage;
        // Handle laboratory address
        if (laboratoryAddress !== undefined) {
            profileData.laboratoryAddress = profileData.laboratoryAddress || {};
            
            // Check if laboratoryAddress is an object or a string
            if (typeof laboratoryAddress === 'object' && laboratoryAddress !== null) {
                // It's an object, extract its properties
                if (laboratoryAddress.address !== undefined) {
                    profileData.laboratoryAddress.address = laboratoryAddress.address;
                }
                if (laboratoryAddress.pinCode !== undefined) {
                    profileData.laboratoryAddress.pinCode = laboratoryAddress.pinCode;
                }
                if (laboratoryAddress.googleMapsLink !== undefined) {
                    profileData.laboratoryAddress.googleMapsLink = laboratoryAddress.googleMapsLink;
                }
                if (laboratoryAddress.latitude !== undefined) {
                    profileData.laboratoryAddress.latitude = laboratoryAddress.latitude;
                }
                if (laboratoryAddress.longitude !== undefined) {
                    profileData.laboratoryAddress.longitude = laboratoryAddress.longitude;
                }
            }
        }
        
        if (city !== undefined && city !== '') profileData.city = city;
        
        // Handle laboratory services
        if (laboratoryServices !== undefined && Array.isArray(laboratoryServices) && laboratoryServices.length > 0) {
            profileData.laboratoryServices = laboratoryServices.map(service => {
                const serviceData: any = {
                    name: service.name,
                    description: service.description || '',
                    collectionType: service.collectionType || 'both',
                    price: service.price || 0
                };
                
                if (service.coverImage) {
                    serviceData.coverImage = service.coverImage;
                }
                
                // Add category if it exists
                if (service.category) {
                    serviceData.category = service.category;
                }
                
                if (service.tests && Array.isArray(service.tests)) {
                    serviceData.tests = service.tests.map((test: any) => ({
                        name: test.name,
                        description: test.description || ''
                    }));
                } else {
                    serviceData.tests = [];
                }
                
                return serviceData;
            });
        }

        // Check if profile already exists for this user
        const existingProfile = await LaboratoryProfile.findOne({ user: userId });

        let laboratoryProfile;
        if (existingProfile) {
            // Update existing profile
            laboratoryProfile = await LaboratoryProfile.findByIdAndUpdate(existingProfile._id, profileData, { new: true });
        } else {
            // Create new profile
            laboratoryProfile = await LaboratoryProfile.create(profileData);
        }

        res.status(200).json(laboratoryProfile);
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
    createUpdateLaboratoryProfile,
    getUploadUrl
}; 