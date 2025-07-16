import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import { UserProfile, DoctorProfile, LaboratoryProfile, DeliveryBoyProfile } from '../models/profileModel';
import Clinic from '../models/clinicModel';
import LaboratoryService from '../models/laboratoryServiceModel';
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

        // Fetch related data for doctor and laboratory profiles
        if (role === 'doctor') {
            // Fetch clinics for doctor profile to maintain API compatibility
            const clinics = await Clinic.find({ doctor: userId, isActive: true });
            const profileWithClinics = {
                ...profile.toObject(),
                clinics: clinics
            };
            
            const availableCities = getCities();
            const availableSpecializations = getSpecializations();
            const availableQualifications = getQualifications();
            
            res.status(200).json({ 
                profile: profileWithClinics, 
                availableCities, 
                availableSpecializations, 
                availableQualifications 
            });
        } else if (role === 'laboratory') {
            // Fetch laboratory services for laboratory profile to maintain API compatibility
            const laboratoryServices = await LaboratoryService.find({ laboratory: userId, isActive: true });
            const profileWithServices = {
                ...profile.toObject(),
                laboratoryServices: laboratoryServices
            };
            
            const availableCities = getCities();
            const availableLabServiceCategories = getCategoriesTestType();
            
            res.status(200).json({ 
                profile: profileWithServices, 
                availableCities, 
                availableLabServiceCategories 
            });
        } else {
            const availableCities = getCities();
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
            availableSlots, availableDays, isAvailable, clinics, city, coverImage
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
        if (coverImage !== undefined && coverImage !== '') profileData.coverImage = coverImage;
        if (city !== undefined && city !== '') profileData.city = city;

        // Handle clinics array - now stored in separate collection
        if (clinics !== undefined && Array.isArray(clinics) && clinics.length > 0) {
            // Remove existing clinics for this doctor
            await Clinic.deleteMany({ doctor: userId });

            // Create new clinics
            const validClinics = clinics.filter(clinic => {
                // Check if clinic has at least one meaningful field
                return clinic && (
                    (clinic.clinicName !== undefined && clinic.clinicName !== '') ||
                    (clinic.clinicPhone !== undefined && clinic.clinicPhone !== '') ||
                    (clinic.clinicEmail !== undefined && clinic.clinicEmail !== '') ||
                    (clinic.clinicWebsite !== undefined && clinic.clinicWebsite !== '') ||
                    (clinic.clinicAddress && (
                        (clinic.clinicAddress.address !== undefined && clinic.clinicAddress.address !== '') ||
                        (clinic.clinicAddress.pinCode !== undefined && clinic.clinicAddress.pinCode !== '') ||
                        (clinic.clinicAddress.googleMapsLink !== undefined && clinic.clinicAddress.googleMapsLink !== '') ||
                        (clinic.clinicAddress.latitude !== undefined) ||
                        (clinic.clinicAddress.longitude !== undefined)
                    ))
                );
            }).map(clinic => {
                const clinicData: any = {
                    doctor: userId,
                    updatedAt: new Date()
                };

                // Add clinic fields only if they are defined and not empty
                if (clinic.clinicName !== undefined && clinic.clinicName !== '') {
                    clinicData.clinicName = clinic.clinicName;
                }
                if (clinic.clinicPhone !== undefined && clinic.clinicPhone !== '') {
                    clinicData.clinicPhone = clinic.clinicPhone;
                }
                if (clinic.clinicEmail !== undefined && clinic.clinicEmail !== '') {
                    clinicData.clinicEmail = clinic.clinicEmail;
                }
                if (clinic.clinicWebsite !== undefined && clinic.clinicWebsite !== '') {
                    clinicData.clinicWebsite = clinic.clinicWebsite;
                }

                // Handle clinic address
                if (clinic.clinicAddress) {
                    const addressData: any = {};
                    
                    if (clinic.clinicAddress.address !== undefined && clinic.clinicAddress.address !== '') {
                        addressData.address = clinic.clinicAddress.address;
                    }
                    if (clinic.clinicAddress.pinCode !== undefined && clinic.clinicAddress.pinCode !== '') {
                        addressData.pinCode = clinic.clinicAddress.pinCode;
                    }
                    if (clinic.clinicAddress.googleMapsLink !== undefined && clinic.clinicAddress.googleMapsLink !== '') {
                        addressData.googleMapsLink = clinic.clinicAddress.googleMapsLink;
                    }
                    if (clinic.clinicAddress.latitude !== undefined) {
                        addressData.latitude = clinic.clinicAddress.latitude;
                    }
                    if (clinic.clinicAddress.longitude !== undefined) {
                        addressData.longitude = clinic.clinicAddress.longitude;
                    }

                    // Only add clinicAddress if it has at least one field
                    if (Object.keys(addressData).length > 0) {
                        clinicData.clinicAddress = addressData;
                    }
                }

                return clinicData;
            });

            if (validClinics.length > 0) {
                await Clinic.insertMany(validClinics);
            }
        } else if (clinics !== undefined && Array.isArray(clinics) && clinics.length === 0) {
            // If empty array is sent, remove all clinics
            await Clinic.deleteMany({ doctor: userId });
        }

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

        // Fetch clinics to include in response for API compatibility
        const updatedClinics = await Clinic.find({ doctor: userId, isActive: true });
        const profileWithClinics = {
            ...doctorProfile!.toObject(),
            clinics: updatedClinics
        };

        res.status(200).json(profileWithClinics);
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
            laboratoryAddress, city, laboratoryServices, coverImage,
            isAvailable, availableDays, availableSlots
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
        if (city !== undefined && city !== '') profileData.city = city;
        if (isAvailable !== undefined) profileData.isAvailable = isAvailable;

        // Handle available days
        if (availableDays !== undefined && Array.isArray(availableDays) && availableDays.length > 0) {
            const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const filteredDays = availableDays.filter(day => validDays.includes(day));
            if (filteredDays.length > 0) {
                profileData.availableDays = filteredDays;
            }
        }

        // Handle available slots
        if (availableSlots !== undefined && Array.isArray(availableSlots) && availableSlots.length > 0) {
            profileData.availableSlots = availableSlots;
        }

        // Handle laboratory address
        if (laboratoryAddress !== undefined) {
            profileData.laboratoryAddress = profileData.laboratoryAddress || {};
            
            // Check if laboratoryAddress is an object or a string
            if (typeof laboratoryAddress === 'object' && laboratoryAddress !== null) {
                // It's an object, extract its properties
                if (laboratoryAddress.address !== undefined && laboratoryAddress.address !== '') {
                    profileData.laboratoryAddress.address = laboratoryAddress.address;
                }
                if (laboratoryAddress.pinCode !== undefined && laboratoryAddress.pinCode !== '') {
                    profileData.laboratoryAddress.pinCode = laboratoryAddress.pinCode;
                }
                if (laboratoryAddress.googleMapsLink !== undefined && laboratoryAddress.googleMapsLink !== '') {
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
        
        // Handle laboratory services - now stored in separate collection
        if (laboratoryServices !== undefined && Array.isArray(laboratoryServices) && laboratoryServices.length > 0) {
            // Remove existing services for this laboratory
            await LaboratoryService.deleteMany({ laboratory: userId });

            // Create new services
            const validServices = laboratoryServices.map(service => {
                const serviceData: any = {
                    laboratory: userId,
                    updatedAt: new Date()
                };
                
                // Only add fields if they have values
                if (service.name !== undefined && service.name !== '') {
                    serviceData.name = service.name;
                }
                if (service.description !== undefined && service.description !== '') {
                    serviceData.description = service.description;
                }
                if (service.coverImage !== undefined && service.coverImage !== '') {
                    serviceData.coverImage = service.coverImage;
                }
                if (service.category !== undefined && service.category !== '') {
                    serviceData.category = service.category;
                }
                if (service.collectionType !== undefined && ['home', 'lab', 'both'].includes(service.collectionType)) {
                    serviceData.collectionType = service.collectionType;
                }
                if (service.price !== undefined && service.price !== null) {
                    serviceData.price = service.price;
                }
                
                // Handle tests array
                if (service.tests && Array.isArray(service.tests) && service.tests.length > 0) {
                    serviceData.tests = service.tests.map((test: any) => {
                        const testData: any = {};
                        // Always include name if it exists
                        if (test.name !== undefined && test.name !== '') {
                            testData.name = test.name;
                        }
                        // Include description even if empty
                        if (test.description !== undefined) {
                            testData.description = test.description;
                        }
                        // Include price even if 0
                        if (test.price !== undefined && test.price !== null && !isNaN(test.price)) {
                            testData.price = Number(test.price);
                        }
                        return testData;
                    }).filter((test: any) => test.name && test.name.trim() !== ''); // Only filter out tests without names
                    // Calculate service price as sum of all test prices if tests have prices
                    if (serviceData.tests.length > 0) {
                        const calculatedPrice = serviceData.tests.reduce((sum: number, test: any) => {
                            return sum + (test.price || 0);
                        }, 0);
                        
                        // Use calculated price if no explicit service price is provided and tests have prices
                        if ((service.price === undefined || service.price === null || service.price === 0) && calculatedPrice > 0) {
                            serviceData.price = calculatedPrice;
                        }
                    }
                }
                
                return serviceData;
            }).filter(service => Object.keys(service).length > 1 && service.name); // Only include services with at least name

            if (validServices.length > 0) {
                await LaboratoryService.insertMany(validServices);
            }
        } else if (laboratoryServices !== undefined && Array.isArray(laboratoryServices) && laboratoryServices.length === 0) {
            // If empty array is sent, remove all services
            await LaboratoryService.deleteMany({ laboratory: userId });
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

        // Fetch laboratory services to include in response for API compatibility
        const updatedServices = await LaboratoryService.find({ laboratory: userId, isActive: true });
        const profileWithServices = {
            ...laboratoryProfile!.toObject(),
            laboratoryServices: updatedServices
        };

        res.status(200).json(profileWithServices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Request file upload URL
const getUploadUrl = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { fileType, fileName, isPermanent } = req.body;

        if (!fileType || !fileName) {
            res.status(400).json({ message: 'File type and name are required' });
            return;
        }

        // Generate a presigned URL for uploading
        const { uploadUrl, publicUrl } = await generateUploadUrlProfile(
            fileType,
            fileName,
            req.user.role,
            req.user._id.toString(),
            isPermanent || fileType === 'application/pdf' // Always set PDFs as permanent
        );

        res.status(200).json({ uploadUrl, publicUrl });
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