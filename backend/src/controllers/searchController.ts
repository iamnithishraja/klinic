import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import { DoctorProfile, LaboratoryProfile } from '../models/profileModel';
import Clinic from '../models/clinicModel';
import LaboratoryService from '../models/laboratoryServiceModel';
import Rating from '../models/ratingModel';
import { getCategoriesTestType, getSpecializations, getCities } from '../utils/selectors';
import { getUserCity } from '../utils/userUtils';

// Helper function to calculate average rating for a profile
const calculateAverageRating = async (profileId: string, type: 'doctor' | 'laboratory') => {
    try {
        let ratings;
        if (type === 'doctor') {
            ratings = await Rating.find({ doctorProfileId: profileId });
        } else {
            // For laboratories, we need to get ratings for all services of this lab
            // Since we're being called with lab profile ID, we need to find all services
            // and aggregate their ratings
            const Laboratory = require('../models/laboratoryServiceModel').default;
            const services = await Laboratory.find({ laboratory: profileId });
            const serviceIds = services.map((service: any) => service._id);
            ratings = await Rating.find({ 
                providerId: { $in: serviceIds }, 
                providerType: 'laboratoryService' 
            });
        }
        
        if (ratings.length === 0) {
            return { averageRating: 0 };
        }
        const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        const averageRating = Math.round((totalRating / ratings.length) * 10) / 10;
        return { averageRating };
    } catch (error) {
        console.error('Error calculating average rating:', error);
        return { averageRating: 0 };
    }
};

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
        console.log(req.query);
        const userCity = await getUserCity(req.user._id);
        const skip = (Number(page) - 1) * Number(limit);

        // Build base filter query
        const baseFilterQuery: any = {
            isAvailable: true,
            status: { $ne: 'rejected' }
        };

        // Gender filter
        if (gender && gender !== '') {
            baseFilterQuery.gender = gender;
        }

        // Specialization filter
        if (specialization && specialization !== '') {
            baseFilterQuery.specializations = { $in: [specialization] };
        }

        // Consultation type filter
        if (consultationType && consultationType !== '') {
            baseFilterQuery.consultationType = { $in: [consultationType, 'both'] };
        }

        // Fee range filter
        if (minFee || maxFee) {
            baseFilterQuery.consultationFee = {};
            if (minFee) baseFilterQuery.consultationFee.$gte = Number(minFee);
            if (maxFee) baseFilterQuery.consultationFee.$lte = Number(maxFee);
        }

        // Rating filter
        if (minRating) {
            baseFilterQuery.rating = { $gte: Number(minRating) };
        }

        // Date availability filter
        if (date) {
            const selectedDate = new Date(date as string);
            const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
            baseFilterQuery.availableDays = { $in: [dayName] };
        }

        let doctorProfiles: any[] = [];
        let totalCount = 0;

        // If city is specified in params, filter by that city only
        if (city && city !== '') {
            const filterQuery = { ...baseFilterQuery, city: city };

            // Handle search with name/clinic matching
            if (search && search !== '') {
                const searchRegex = new RegExp(search as string, 'i');
                
                // Find doctors by user name
                const doctorsWithMatchingNames = await DoctorProfile.find(filterQuery)
                    .populate({
                        path: 'user',
                        match: { name: searchRegex },
                        select: '_id name'
                    })
                    .lean();

                const matchingDoctorIds = doctorsWithMatchingNames
                    .filter(doc => doc.user)
                    .map(doc => doc._id);

                // Create search filter for clinic names or matching doctor IDs
                const searchFilter = {
                    ...filterQuery,
                    $or: [
                        { 'clinics.clinicName': searchRegex },
                        ...(matchingDoctorIds.length > 0 ? [{ _id: { $in: matchingDoctorIds } }] : [])
                    ]
                };

                totalCount = await DoctorProfile.countDocuments(searchFilter);
                doctorProfiles = await DoctorProfile.find(searchFilter)
                    .populate('user', 'name email phone profilePicture')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean();
            } else {
                totalCount = await DoctorProfile.countDocuments(filterQuery);
                doctorProfiles = await DoctorProfile.find(filterQuery)
                    .populate('user', 'name email phone profilePicture')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean();
            }
        } 
        // If no city filter but user has a city, prioritize user's city
        else if (userCity) {
            // First get doctors from user's city
            const userCityQuery = { ...baseFilterQuery, city: userCity };

            const userCityDoctors = await DoctorProfile.find(userCityQuery)
                .populate('user')
                .sort({ createdAt: -1 })
                .lean();
            
            // Filter by doctor name after population if search is provided
            let filteredUserCityDoctors = userCityDoctors;
            if (search && search !== '') {
                const searchRegex = new RegExp(search as string, 'i');
                filteredUserCityDoctors = userCityDoctors.filter(doctor => 
                    (doctor.user as any)?.name?.match(searchRegex)
                );
            }

            // Then get doctors from other cities
            const otherCitiesQuery = { 
                ...baseFilterQuery, 
                city: { $ne: userCity }
            };

            const otherCityDoctors = await DoctorProfile.find(otherCitiesQuery)
                .populate('user')
                .sort({ createdAt: -1 })
                .lean();

            // Filter by doctor name after population if search is provided
            let filteredOtherCityDoctors = otherCityDoctors;
            if (search && search !== '') {
                const searchRegex = new RegExp(search as string, 'i');
                filteredOtherCityDoctors = otherCityDoctors.filter(doctor => 
                    (doctor.user as any)?.name?.match(searchRegex)
                );
            }

            // Combine results with user city first
            const allDoctors = [...filteredUserCityDoctors, ...filteredOtherCityDoctors];
            totalCount = allDoctors.length;
            doctorProfiles = allDoctors.slice(skip, skip + Number(limit));
        } 
        // No city filter and no user city
        else {
            const filterQuery = { ...baseFilterQuery };
            
            if (search && search !== '') {
                const searchRegex = new RegExp(search as string, 'i');
                
                // Find doctors by user name
                const doctorsWithMatchingNames = await DoctorProfile.find(filterQuery)
                    .populate({
                        path: 'user',
                        match: { name: searchRegex },
                        select: '_id name'
                    })
                    .lean();

                const matchingDoctorIds = doctorsWithMatchingNames
                    .filter(doc => doc.user)
                    .map(doc => doc._id);

                // Create search filter
                const searchFilter = {
                    ...filterQuery,
                    $or: [
                        { 'clinics.clinicName': searchRegex },
                        ...(matchingDoctorIds.length > 0 ? [{ _id: { $in: matchingDoctorIds } }] : [])
                    ]
                };

                totalCount = await DoctorProfile.countDocuments(searchFilter);
                doctorProfiles = await DoctorProfile.find(searchFilter)
                    .populate('user', 'name email phone profilePicture')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean();
            } else {
                totalCount = await DoctorProfile.countDocuments(filterQuery);
                doctorProfiles = await DoctorProfile.find(filterQuery)
                    .populate('user', 'name email phone profilePicture')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean();
            }
        }

        // Fetch clinics and ratings for each doctor and attach them to the profile
        const doctorProfilesWithClinics = await Promise.all(
            doctorProfiles.map(async (doctor) => {
                const clinics = await Clinic.find({ doctor: doctor.user._id, isActive: true });
                const ratingData = await calculateAverageRating(doctor._id.toString(), 'doctor');
                return {
                    ...doctor,
                    clinics: clinics,
                    rating: ratingData.averageRating
                };
            })
        );

        const totalPages = Math.ceil(totalCount / Number(limit));
        const availableSpecializations = getSpecializations();
        const availableCities = getCities();

        res.status(200).json({
            doctors: doctorProfilesWithClinics,
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
        
        console.log('Search parameters:', req.query);
        
        const userCity = await getUserCity(req.user._id);
        console.log('User city:', userCity);
        
        const skip = (Number(page) - 1) * Number(limit);

        // Build base filter query for laboratories
        const baseFilterQuery: any = {
            isAvailable: true
        };

        // Date availability filter
        if (date) {
            const selectedDate = new Date(date as string);
            const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
            baseFilterQuery.availableDays = { $in: [dayName] };
            console.log('Date filter applied:', dayName);
        }

        // Build service filter conditions for matching services
        const serviceFilterQuery: any = {
            isActive: true
        };
        
        if (category && category !== '') {
            serviceFilterQuery.category = category;
        }
        
        if (collectionType && collectionType !== '') {
            serviceFilterQuery.collectionType = { $in: [collectionType, 'both'] };
        }
        
        if (minPrice || maxPrice) {
            serviceFilterQuery.price = {};
            if (minPrice) serviceFilterQuery.price.$gte = Number(minPrice);
            if (maxPrice) serviceFilterQuery.price.$lte = Number(maxPrice);
        }
        
        if (minRating) {
            serviceFilterQuery.rating = { $gte: Number(minRating) };
        }

        // Handle search across laboratory names and service names
        if (search && search !== '') {
            const searchRegex = new RegExp(search as string, 'i');
            // We'll handle this in the aggregation pipeline
        }

        console.log('Laboratory filter:', baseFilterQuery);
        console.log('Service filter:', serviceFilterQuery);

        // Build aggregation pipeline
        const aggregationPipeline: any[] = [];

        // Add location filters to match stage
        let locationMatch: any = { ...baseFilterQuery };
        
        // If city is specified in params, filter by that city only
        if (city && city !== '') {
            locationMatch.city = city;
            if (pinCode && pinCode !== '') {
                locationMatch['laboratoryAddress.pinCode'] = pinCode;
            }
        }
        
        console.log('Location match filter:', locationMatch);
        
        aggregationPipeline.push({ $match: locationMatch });

        // Lookup laboratory services from separate collection
        aggregationPipeline.push({
            $lookup: {
                from: 'laboratoryservices',
                let: { labId: '$user' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$laboratory', '$$labId'] },
                            ...serviceFilterQuery
                        }
                    }
                ],
                as: 'laboratoryServices'
            }
        });

        // Handle search filter after services are populated
        if (search && search !== '') {
            const searchRegex = new RegExp(search as string, 'i');
            aggregationPipeline.push({
                $match: {
                    $or: [
                        { laboratoryName: searchRegex },
                        { 'laboratoryServices.name': searchRegex },
                        { 'laboratoryServices.tests.name': searchRegex }
                    ]
                }
            });
        }

        // Remove laboratories with no matching services if service filters were applied
        const hasServiceFilters = Object.keys(serviceFilterQuery).length > 1; // > 1 because isActive is always there
        if (hasServiceFilters) {
            aggregationPipeline.push({
                $match: {
                    'laboratoryServices.0': { $exists: true }
                }
            });
        }

        // Add population stage
        aggregationPipeline.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user',
                pipeline: [
                    { $project: { name: 1, email: 1, phone: 1 } }
                ]
            }
        });

        aggregationPipeline.push({
            $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true
            }
        });

        console.log('Aggregation pipeline:', JSON.stringify(aggregationPipeline, null, 2));

        let laboratoryProfiles: any[] = [];
        let totalCount = 0;

        // Handle city prioritization for aggregation
        if (!city && userCity) {
            console.log('Using city prioritization logic');
            
            // First get labs from user's city
            const userCityPipeline = [...aggregationPipeline];
            userCityPipeline[0].$match = { ...userCityPipeline[0].$match, city: userCity };
            
            if (pinCode && pinCode !== '') {
                userCityPipeline.splice(-1, 0, { $match: { 'laboratoryAddress.pinCode': pinCode } });
            }

            const userCityLabs = await LaboratoryProfile.aggregate([
                ...userCityPipeline,
                { $sort: { createdAt: -1 } }
            ]);

            console.log(`User city labs found: ${userCityLabs.length}`);

            // Then get labs from other cities
            const otherCitiesPipeline = [...aggregationPipeline];
            otherCitiesPipeline[0].$match = { ...otherCitiesPipeline[0].$match, city: { $ne: userCity } };
            
            if (pinCode && pinCode !== '') {
                otherCitiesPipeline.splice(-1, 0, { $match: { 'laboratoryAddress.pinCode': pinCode } });
            }

            const otherCityLabs = await LaboratoryProfile.aggregate([
                ...otherCitiesPipeline,
                { $sort: { createdAt: -1 } }
            ]);

            console.log(`Other city labs found: ${otherCityLabs.length}`);

            // Combine results with user city first
            const allLabs = [...userCityLabs, ...otherCityLabs];
            totalCount = allLabs.length;
            laboratoryProfiles = allLabs.slice(skip, skip + Number(limit));
        } else {
            console.log('Using standard aggregation logic');
            
            // Handle pinCode for non-user-city scenarios
            if (!city && pinCode && pinCode !== '') {
                aggregationPipeline.push({
                    $match: { 'laboratoryAddress.pinCode': pinCode }
                });
            }

            // Get total count
            const countPipeline = [
                ...aggregationPipeline,
                { $count: 'total' }
            ];
            
            console.log('Count pipeline:', JSON.stringify(countPipeline, null, 2));
            
            const countResult = await LaboratoryProfile.aggregate(countPipeline);
            totalCount = countResult.length > 0 ? countResult[0].total : 0;
            console.log('Total count from aggregation:', totalCount);

            // Get paginated results
            const finalPipeline = [
                ...aggregationPipeline,
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) }
            ];
            
            console.log('Final pipeline:', JSON.stringify(finalPipeline, null, 2));
            
            laboratoryProfiles = await LaboratoryProfile.aggregate(finalPipeline);
            console.log('Laboratory profiles found:', laboratoryProfiles.length);
        }

        // Debug: If no labs found, let's check what's in the database
        if (laboratoryProfiles.length === 0) {
            console.log('No laboratories found. Checking database structure...');
            
            // Get a sample document to understand the structure
            const sampleLab = await LaboratoryProfile.findOne({}).limit(1);
            console.log('Sample laboratory document:', JSON.stringify(sampleLab, null, 2));
            
            // Check if there are any labs that match the base filter
            const matchingLabs = await LaboratoryProfile.find(baseFilterQuery).limit(5);
            console.log('Labs matching base filter:', matchingLabs.length);
            
            if (matchingLabs.length > 0) {
                console.log('Sample matching lab:', JSON.stringify(matchingLabs[0], null, 2));
            }
        }

        // Add rating information to laboratory profiles
        const laboratoriesWithRatings = await Promise.all(
            laboratoryProfiles.map(async (lab) => {
                const ratingData = await calculateAverageRating(lab._id.toString(), 'laboratory');
                return {
                    ...lab,
                    rating: ratingData.averageRating
                };
            })
        );

        // Attach ratings to each laboratory service
        const labsWithServiceRatings = await Promise.all(
          laboratoriesWithRatings.map(async (lab) => {
            const servicesWithRatings = await Promise.all(
              (lab.laboratoryServices || []).map(async (service) => {
                if (!service._id) return service;
                const dbService = await LaboratoryService.findById(service._id).lean();
                return {
                  ...service,
                  rating: dbService?.rating || 0,
                  totalRatings: dbService?.totalRatings || 0,
                  ratingBreakdown: dbService?.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                };
              })
            );
            return {
              ...lab,
              laboratoryServices: servicesWithRatings
            };
          })
        );

        const totalPages = Math.ceil(totalCount / Number(limit));
        const availableCategories = getCategoriesTestType();
        const availableCities = getCities();

        res.status(200).json({
            laboratories: labsWithServiceRatings,
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
        console.error('Error in searchLaboratories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export {
    searchDoctors,
    searchLaboratories
};