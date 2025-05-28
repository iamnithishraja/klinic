import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import { DoctorProfile, LaboratoryProfile } from '../models/profileModel';
import { getCategoriesTestType, getSpecializations, getCities } from '../utils/selectors';
import { getUserCity } from '../utils/userUtils';

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
            isAvailable: true
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
            
            // Add pinCode filter if provided
            if (pinCode && pinCode !== '') {
                filterQuery['clinics.clinicAddress.pinCode'] = pinCode;
            }

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
            if (pinCode && pinCode !== '') {
                userCityQuery['clinics.clinicAddress.pinCode'] = pinCode;
            }

            const userCityDoctors = await DoctorProfile.find(userCityQuery)
                .populate('user')
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
                ...baseFilterQuery, 
                city: { $ne: userCity }
            };
            if (pinCode && pinCode !== '') {
                otherCitiesQuery['clinics.clinicAddress.pinCode'] = pinCode;
            }

            const otherCityDoctors = await DoctorProfile.find(otherCitiesQuery)
                .populate('user')
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
        } 
        // No city filter and no user city
        else {
            const filterQuery = { ...baseFilterQuery };
            if (pinCode && pinCode !== '') {
                filterQuery['clinics.clinicAddress.pinCode'] = pinCode;
            }
            
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
        
        console.log('Search parameters:', req.query);
        
        const userCity = await getUserCity(req.user._id);
        console.log('User city:', userCity);
        
        const skip = (Number(page) - 1) * Number(limit);

        // Build base filter query for laboratories (not services)
        const baseFilterQuery: any = {
            isAvailable: true
        };

        // Debug: Check total laboratories without any filters
        const totalLabsCount = await LaboratoryProfile.countDocuments({});
        const availableLabsCount = await LaboratoryProfile.countDocuments({ isAvailable: true });
        console.log(`Total laboratories in DB: ${totalLabsCount}`);
        console.log(`Available laboratories in DB: ${availableLabsCount}`);

        // Search filter (laboratory name, service name)
        if (search && search !== '') {
            const searchRegex = new RegExp(search as string, 'i');
            baseFilterQuery.$or = [
                { laboratoryName: searchRegex },
                { 'laboratoryServices.name': searchRegex },
                { 'laboratoryServices.tests.name': searchRegex }
            ];
        }

        // Date availability filter
        if (date) {
            const selectedDate = new Date(date as string);
            const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
            baseFilterQuery.availableDays = { $in: [dayName] };
            console.log('Date filter applied:', dayName);
        }

        // Build service filter conditions for $filter in aggregation
        const serviceFilterConditions: any[] = [];
        
        if (category && category !== '') {
            serviceFilterConditions.push({ $eq: ['$$service.category', category] });
        }
        
        if (collectionType && collectionType !== '') {
            serviceFilterConditions.push({
                $or: [
                    { $eq: ['$$service.collectionType', collectionType] },
                    { $eq: ['$$service.collectionType', 'both'] }
                ]
            });
        }
        
        if (minPrice || maxPrice) {
            const priceConditions: any[] = [];
            if (minPrice) priceConditions.push({ $gte: ['$$service.price', Number(minPrice)] });
            if (maxPrice) priceConditions.push({ $lte: ['$$service.price', Number(maxPrice)] });
            serviceFilterConditions.push(...priceConditions);
        }
        
        if (minRating) {
            serviceFilterConditions.push({ $gte: ['$$service.rating', Number(minRating)] });
        }

        console.log('Service filter conditions:', serviceFilterConditions);

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

        // Filter laboratory services if any service filters are applied
        if (serviceFilterConditions.length > 0) {
            const filterCondition = serviceFilterConditions.length === 1 
                ? serviceFilterConditions[0]
                : { $and: serviceFilterConditions };

            aggregationPipeline.push({
                $addFields: {
                    laboratoryServices: {
                        $filter: {
                            input: '$laboratoryServices',
                            as: 'service',
                            cond: filterCondition
                        }
                    }
                }
            });

            // Remove laboratories with no matching services
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
        console.error('Error in searchLaboratories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export {
    searchDoctors,
    searchLaboratories
};