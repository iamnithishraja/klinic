import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import { DoctorProfile, LaboratoryProfile } from '../models/profileModel';
import { getCategoriesTestType, getSpecializations, getCities } from '../utils/selectors';

// Search doctors with filters
const searchDoctors = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {
            city,
            pinCode,
            specialization,
            gender,
            consultationType,
            minFee,
            maxFee,
            minRating,
            date,
            search,
            page = 1,
            limit = 10
        } = req.query;

        const userCity = req.user?.city; // Assuming user city is available in req.user
        const skip = (Number(page) - 1) * Number(limit);

        // Build filter query
        const filterQuery: any = {
            isAvailable: true
        };

        // Gender filter
        if (gender && gender !== '') {
            filterQuery.gender = gender;
        }

        // Specialization filter
        if (specialization && specialization !== '') {
            filterQuery.specializations = { $in: [specialization] };
        }

        // Consultation type filter
        if (consultationType && consultationType !== '') {
            filterQuery.consultationType = { $in: [consultationType, 'both'] };
        }

        // Fee range filter
        if (minFee || maxFee) {
            filterQuery.consultationFee = {};
            if (minFee) filterQuery.consultationFee.$gte = Number(minFee);
            if (maxFee) filterQuery.consultationFee.$lte = Number(maxFee);
        }

        // Rating filter
        if (minRating) {
            filterQuery.rating = { $gte: Number(minRating) };
        }

        // Search filter (doctor name, clinic name)
        if (search && search !== '') {
            const searchRegex = new RegExp(search as string, 'i');
            filterQuery.$or = [
                { 'clinics.clinicName': searchRegex },
                // We'll also populate user and search by name
            ];
        }

        // Date availability filter - only check day
        if (date) {
            const selectedDate = new Date(date as string);
            const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
            filterQuery.availableDays = { $in: [dayName] };
        }

        // Location filters - create separate queries for city priority
        let doctorProfiles: any[] = [];
        let totalCount = 0;

        if (city && city !== '') {
            // Search in specific city
            filterQuery.city = city;
            if (pinCode && pinCode !== '') {
                filterQuery['clinics.clinicAddress.pinCode'] = pinCode;
            }
        } else if (userCity) {
            // First get doctors from user's city
            const userCityQuery = { ...filterQuery, city: userCity };
            if (pinCode && pinCode !== '') {
                userCityQuery['clinics.clinicAddress.pinCode'] = pinCode;
            }

            const userCityDoctors = await DoctorProfile.find(userCityQuery)
                .populate('user', 'name email phone profilePicture')
                .sort({ createdAt: -1 })
                .lean();

            // Filter by doctor name after population if search is provided
            let filteredUserCityDoctors = userCityDoctors;
            if (search && search !== '') {
                const searchRegex = new RegExp(search as string, 'i');
                filteredUserCityDoctors = userCityDoctors.filter(doctor => 
                    (doctor.user as any)?.name?.match(searchRegex) ||
                    doctor.clinics?.some(clinic => clinic.clinicName?.match(searchRegex))
                );
            }

            // Then get doctors from other cities
            const otherCitiesQuery = { 
                ...filterQuery, 
                city: { $ne: userCity }
            };
            if (pinCode && pinCode !== '') {
                otherCitiesQuery['clinics.clinicAddress.pinCode'] = pinCode;
            }

            const otherCityDoctors = await DoctorProfile.find(otherCitiesQuery)
                .populate('user', 'name email phone profilePicture')
                .sort({ createdAt: -1 })
                .lean();

            // Filter by doctor name after population if search is provided
            let filteredOtherCityDoctors = otherCityDoctors;
            if (search && search !== '') {
                const searchRegex = new RegExp(search as string, 'i');
                filteredOtherCityDoctors = otherCityDoctors.filter(doctor => 
                    (doctor.user as any)?.name?.match(searchRegex) ||
                    doctor.clinics?.some(clinic => clinic.clinicName?.match(searchRegex))
                );
            }

            // Combine results with user city first
            const allDoctors = [...filteredUserCityDoctors, ...filteredOtherCityDoctors];
            totalCount = allDoctors.length;
            doctorProfiles = allDoctors.slice(skip, skip + Number(limit));
        } else {
            // No user city or specific city filter
            if (pinCode && pinCode !== '') {
                filterQuery['clinics.clinicAddress.pinCode'] = pinCode;
            }
            
            totalCount = await DoctorProfile.countDocuments(filterQuery);
            doctorProfiles = await DoctorProfile.find(filterQuery)
                .populate('user', 'name email phone profilePicture')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean();

            // Filter by doctor name after population if search is provided
            if (search && search !== '') {
                const searchRegex = new RegExp(search as string, 'i');
                doctorProfiles = doctorProfiles.filter(doctor => 
                    (doctor.user as any)?.name?.match(searchRegex) ||
                    doctor.clinics?.some((clinic: any) => clinic.clinicName?.match(searchRegex))
                );
            }
        }

        const totalPages = Math.ceil(totalCount / Number(limit));
        const availableSpecializations = getSpecializations();
        const availableCities = getCities();

        res.status(200).json({
            doctors: doctorProfiles,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalCount,
                hasNextPage: Number(page) < totalPages,
                hasPrevPage: Number(page) > 1
            },
            filters: {
                availableSpecializations,
                availableCities,
                genderOptions: ['male', 'female'],
                consultationTypes: ['in-person', 'online', 'both']
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Search laboratories with filters
const searchLaboratories = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {
            city,
            pinCode,
            category,
            collectionType,
            minPrice,
            maxPrice,
            minRating,
            date,
            search,
            page = 1,
            limit = 10
        } = req.query;

        const userCity = req.user?.city; // Assuming user city is available in req.user
        const skip = (Number(page) - 1) * Number(limit);

        // Build filter query
        const filterQuery: any = {
            isAvailable: true
        };

        // Category filter
        if (category && category !== '') {
            filterQuery['laboratoryServices.category'] = category;
        }

        // Collection type filter
        if (collectionType && collectionType !== '') {
            filterQuery['laboratoryServices.collectionType'] = { $in: [collectionType, 'both'] };
        }

        // Price range filter
        if (minPrice || maxPrice) {
            const priceFilter: any = {};
            if (minPrice) priceFilter.$gte = Number(minPrice);
            if (maxPrice) priceFilter.$lte = Number(maxPrice);
            filterQuery['laboratoryServices.price'] = priceFilter;
        }

        // Rating filter for services
        if (minRating) {
            filterQuery['laboratoryServices.rating'] = { $gte: Number(minRating) };
        }

        // Search filter (laboratory name, service name)
        if (search && search !== '') {
            const searchRegex = new RegExp(search as string, 'i');
            filterQuery.$or = [
                { laboratoryName: searchRegex },
                { 'laboratoryServices.name': searchRegex }
            ];
        }

        // Date availability filter - only check day
        if (date) {
            const selectedDate = new Date(date as string);
            const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
            filterQuery.availableDays = { $in: [dayName] };
        }

        // Location filters - create separate queries for city priority
        let laboratoryProfiles: any[] = [];
        let totalCount = 0;

        if (city && city !== '') {
            // Search in specific city
            filterQuery.city = city;
            if (pinCode && pinCode !== '') {
                filterQuery['laboratoryAddress.pinCode'] = pinCode;
            }
        } else if (userCity) {
            // First get labs from user's city
            const userCityQuery = { ...filterQuery, city: userCity };
            if (pinCode && pinCode !== '') {
                userCityQuery['laboratoryAddress.pinCode'] = pinCode;
            }

            const userCityLabs = await LaboratoryProfile.find(userCityQuery)
                .populate('user', 'name email phone')
                .sort({ createdAt: -1 })
                .lean();

            // Then get labs from other cities
            const otherCitiesQuery = { 
                ...filterQuery, 
                city: { $ne: userCity }
            };
            if (pinCode && pinCode !== '') {
                otherCitiesQuery['laboratoryAddress.pinCode'] = pinCode;
            }

            const otherCityLabs = await LaboratoryProfile.find(otherCitiesQuery)
                .populate('user', 'name email phone')
                .sort({ createdAt: -1 })
                .lean();

            // Combine results with user city first
            const allLabs = [...userCityLabs, ...otherCityLabs];
            totalCount = allLabs.length;
            laboratoryProfiles = allLabs.slice(skip, skip + Number(limit));
        } else {
            // No user city or specific city filter
            if (pinCode && pinCode !== '') {
                filterQuery['laboratoryAddress.pinCode'] = pinCode;
            }
            
            totalCount = await LaboratoryProfile.countDocuments(filterQuery);
            laboratoryProfiles = await LaboratoryProfile.find(filterQuery)
                .populate('user', 'name email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean();
        }

        const totalPages = Math.ceil(totalCount / Number(limit));
        const availableCategories = getCategoriesTestType();
        const availableCities = getCities();

        res.status(200).json({
            laboratories: laboratoryProfiles,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalCount,
                hasNextPage: Number(page) < totalPages,
                hasPrevPage: Number(page) > 1
            },
            filters: {
                availableCategories,
                availableCities,
                collectionTypes: ['home', 'lab', 'both']
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export {
    searchDoctors,
    searchLaboratories
};