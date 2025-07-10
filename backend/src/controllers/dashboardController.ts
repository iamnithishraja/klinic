import type { Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import DoctorAppointment from "../models/doctorAppointments";
import LabAppointment from "../models/labAppointments";
import Clinic from "../models/clinicModel";
import LaboratoryService from "../models/laboratoryServiceModel";
import { DoctorProfile, LaboratoryProfile } from "../models/profileModel";
import User from "../models/userModel";

// Helper function to format Date object to display string in IST
const formatDateToDisplayString = (date: Date): string => {
    try {
        // Convert UTC date to IST (UTC + 5:30)
        const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
        
        // Get day name
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[istDate.getDay()];
        
        // Format time in 12-hour format
        let hour = istDate.getHours();
        const minute = istDate.getMinutes();
        const period = hour >= 12 ? 'PM' : 'AM';
        
        if (hour === 0) hour = 12;
        else if (hour > 12) hour = hour - 12;
        
        const timeString = `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
        
        return `${dayName} ${timeString}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return date.toString();
    }
};

const getUserDashboard = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user._id;
        
        // Get upcoming doctor appointments (exclude unpaid online consultations)
        const upcomingDoctorAppointments = await DoctorAppointment.find({
            patient: userId,
            status: 'upcoming',
            $or: [
                { consultationType: 'in-person' }, // All in-person appointments
                { consultationType: 'online', isPaid: true } // Only paid online appointments
            ]
        })
        .populate('doctor', 'name email phone')
        .populate('clinic')
        .sort({ timeSlot: 1 });

        // Populate doctor profiles for cover images
        for (let i = 0; i < upcomingDoctorAppointments.length; i++) {
            const appointment = upcomingDoctorAppointments[i];
            const doctorUser = appointment?.doctor;
            if (doctorUser) {
                try {
                    const doctorProfile = await DoctorProfile.findOne({ user: (doctorUser as any)._id });
                    if (doctorProfile) {
                        if (doctorProfile.coverImage) {
                        (appointment.doctor as any).coverImage = doctorProfile.coverImage;
                        }
                        // Add doctor profile ID for rating purposes
                        (appointment.doctor as any).profileId = doctorProfile._id;
                    }
                } catch (error) {
                    console.log('Error fetching doctor profile:', error);
                }
            }
        }

        // Get upcoming lab appointments (include both pending and upcoming statuses)
        const upcomingLabAppointments = await LabAppointment.find({
            patient: userId,
            status: { $in: ['pending', 'upcoming'] }
        })
        .populate('lab', 'name email phone')
        .populate('laboratoryService')
        .sort({ timeSlot: 1 });

        // Populate laboratory profiles for address data and laboratory name
        for (let i = 0; i < upcomingLabAppointments.length; i++) {
            const appointment = upcomingLabAppointments[i];
            const labUser = appointment?.lab;
            if (labUser) {
                try {
                    const labProfile = await LaboratoryProfile.findOne({ user: (labUser as any)._id });
                    if (labProfile) {
                        if (labProfile.laboratoryAddress) {
                            (appointment.lab as any).laboratoryAddress = labProfile.laboratoryAddress;
                        }
                        if (labProfile.laboratoryName) {
                            (appointment.lab as any).laboratoryName = labProfile.laboratoryName;
                        }
                        // Add laboratory profile ID for rating purposes
                        (appointment.lab as any).profileId = labProfile._id;
                    }
                } catch (error) {
                    console.log('Error fetching lab profile:', error);
                }
            }
        }

        // Combine and sort all upcoming appointments by time
        const allUpcomingAppointments = [
            ...upcomingDoctorAppointments.map(apt => {
                const appointmentObj = apt.toObject();
                // Ensure cover image is included in the response
                if ((apt.doctor as any)?.coverImage && appointmentObj.doctor) {
                    (appointmentObj.doctor as any).coverImage = (apt.doctor as any).coverImage;
                }
                return {
                    ...appointmentObj,
                    type: 'doctor',
                    providerName: (apt.doctor as any)?.name,
                    serviceName: 'Doctor Consultation',
                    timeSlotDisplay: formatDateToDisplayString(apt.timeSlot)
                };
            }),
            ...upcomingLabAppointments.map(apt => {
                const appointmentObj = apt.toObject();
                return {
                    ...appointmentObj,
                    type: 'laboratory',
                    providerName: (apt.lab as any)?.laboratoryName || (apt.lab as any)?.name,
                    serviceName: (apt.laboratoryService as any)?.name,
                    // Use package cover image from laboratoryService
                    packageCoverImage: (apt.laboratoryService as any)?.coverImage,
                    timeSlotDisplay: formatDateToDisplayString(apt.timeSlot)
                };
            })
        ].sort((a, b) => new Date(a.timeSlot).getTime() - new Date(b.timeSlot).getTime());

        res.status(200).json({
            upcomingAppointments: allUpcomingAppointments,
            totalUpcoming: allUpcomingAppointments.length
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getPreviousAppointments = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Get previous doctor appointments
        const previousDoctorAppointments = await DoctorAppointment.find({
            patient: userId,
            status: 'completed'
        })
        .populate('doctor', 'name email phone')
        .populate('clinic')
        .sort({ timeSlot: -1 })
        .skip(skip)
        .limit(limit);

        // Populate doctor profiles for cover images
        for (let i = 0; i < previousDoctorAppointments.length; i++) {
            const appointment = previousDoctorAppointments[i];
            const doctorUser = appointment?.doctor;
            if (doctorUser) {
                try {
                    const doctorProfile = await DoctorProfile.findOne({ user: (doctorUser as any)._id });
                    if (doctorProfile) {
                        if (doctorProfile.coverImage) {
                        (appointment.doctor as any).coverImage = doctorProfile.coverImage;
                        }
                        // Add doctor profile ID for rating purposes
                        (appointment.doctor as any).profileId = doctorProfile._id;
                    }
                } catch (error) {
                    console.log('Error fetching doctor profile:', error);
                }
            }
        }

        const totalPreviousAppointments = await DoctorAppointment.countDocuments({
            patient: userId,
            status: 'completed'
        });

        res.status(200).json({
            appointments: previousDoctorAppointments.map(apt => {
                const appointmentObj = apt.toObject();
                // Ensure cover image is included in the response
                if ((apt.doctor as any)?.coverImage && appointmentObj.doctor) {
                    (appointmentObj.doctor as any).coverImage = (apt.doctor as any).coverImage;
                }
                return {
                    ...appointmentObj,
                    type: 'doctor',
                    providerName: (apt.doctor as any)?.name,
                    timeSlotDisplay: formatDateToDisplayString(apt.timeSlot)
                };
            }),
            pagination: {
                current: page,
                total: Math.ceil(totalPreviousAppointments / limit),
                hasNext: skip + limit < totalPreviousAppointments,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Previous appointments error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getPreviousLabTests = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Get previous lab appointments (both completed and marked-as-read)
        const previousLabTests = await LabAppointment.find({
            patient: userId,
            status: { $in: ['completed', 'marked-as-read'] }
        })
        .populate('lab', 'name email phone')
        .populate('laboratoryService', 'name description coverImage')
        .sort({ timeSlot: -1 })
        .skip(skip)
        .limit(limit);

        console.log('🔍 Raw lab tests from database:');
        for (const test of previousLabTests) {
            console.log(`🔍 Test ${test._id}:`, {
                laboratoryServiceId: test.laboratoryService,
                laboratoryServicePopulated: test.laboratoryService,
                hasLaboratoryService: !!test.laboratoryService,
                laboratoryServiceIdString: test.laboratoryService?._id?.toString(),
                laboratoryServiceName: test.laboratoryService?.name
            });
            
            // Try to manually fetch the laboratory service if it's not populated
            if (!test.laboratoryService) {
                console.log(`⚠️ Laboratory service is null for test ${test._id}`);
                // Check if there's a laboratoryService ID in the raw document
                const rawTest = test.toObject();
                console.log(`🔍 Raw test object:`, rawTest);
                
                            // Try to manually fetch the laboratory service by ID
            if (rawTest.laboratoryService) {
                try {
                    const LaboratoryService = require('../models/laboratoryServiceModel').default;
                    console.log(`🔍 Trying to fetch laboratory service with ID:`, rawTest.laboratoryService);
                    const service = await LaboratoryService.findById(rawTest.laboratoryService);
                    console.log(`🔍 Manually fetched laboratory service:`, service);
                    if (service) {
                        // Update the test object with the populated service
                        (test as any).laboratoryService = service;
                        console.log(`✅ Successfully populated laboratory service for test ${test._id}`);
                    } else {
                        console.log(`❌ Laboratory service not found with ID:`, rawTest.laboratoryService);
                        // Try to find any laboratory service to use as fallback
                        const anyService = await LaboratoryService.findOne();
                        if (anyService) {
                            console.log(`⚠️ Using fallback laboratory service:`, anyService._id);
                            (test as any).laboratoryService = anyService;
                        }
                    }
                } catch (error) {
                    console.log(`❌ Error fetching laboratory service:`, error);
                }
            } else {
                console.log(`❌ No laboratoryService ID found in raw test object`);
                // Try to find laboratory services for this lab
                try {
                    const LaboratoryService = require('../models/laboratoryServiceModel').default;
                    console.log(`🔍 Looking for laboratory services for lab:`, rawTest.lab);
                    const services = await LaboratoryService.find({ laboratory: rawTest.lab });
                    console.log(`🔍 Found ${services.length} services for lab:`, services.map(s => ({ id: s._id, name: s.name })));
                    
                    if (services.length > 0) {
                        // Use the first service as the laboratory service
                        const firstService = services[0];
                        (test as any).laboratoryService = firstService;
                        console.log(`✅ Using first laboratory service: ${firstService.name} (${firstService._id})`);
                    } else {
                        console.log(`❌ No laboratory services found for lab:`, rawTest.lab);
                    }
                } catch (error) {
                    console.log(`❌ Error finding laboratory services:`, error);
                }
            }
            }
        }

        const totalPreviousTests = await LabAppointment.countDocuments({
            patient: userId,
            status: { $in: ['completed', 'marked-as-read'] }
        });

        // Populate laboratory profiles for lab names only (cover image comes from laboratoryService)
        for (let i = 0; i < previousLabTests.length; i++) {
            const test = previousLabTests[i];
            const labUser = test?.lab;
            if (labUser) {
                try {
                    const labProfile = await LaboratoryProfile.findOne({ user: (labUser as any)._id });
                    if (labProfile) {
                        if (labProfile.laboratoryName) {
                        (test.lab as any).laboratoryName = labProfile.laboratoryName;
                        }
                        // Add laboratory profile ID for rating purposes
                        (test.lab as any).profileId = labProfile._id;
                    }
                } catch (error) {
                    console.log('Error fetching lab profile:', error);
                }
            }
        }

        res.status(200).json({
            labTests: previousLabTests.map(test => {
                const testObj = test.toObject();
                console.log(`🔍 Lab test ${test._id} - laboratoryService:`, test.laboratoryService);
                console.log(`🔍 Lab test ${test._id} - laboratoryService type:`, typeof test.laboratoryService);
                console.log(`🔍 Lab test ${test._id} - laboratoryService keys:`, test.laboratoryService ? Object.keys(test.laboratoryService) : 'null/undefined');
                
                const responseObj = {
                    ...testObj,
                    type: 'laboratory',
                    providerName: (test.lab as any)?.laboratoryName || (test.lab as any)?.name,
                    // Use package cover image from laboratoryService
                    packageCoverImage: (test.laboratoryService as any)?.coverImage,
                    timeSlotDisplay: formatDateToDisplayString(test.timeSlot)
                };
                
                console.log(`🔍 Lab test ${test._id} - final response object:`, JSON.stringify(responseObj, null, 2));
                return responseObj;
            }),
            pagination: {
                current: page,
                total: Math.ceil(totalPreviousTests / limit),
                hasNext: skip + limit < totalPreviousTests,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Previous lab tests error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getAppointmentPrescription = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const { appointmentId } = req.params;

        const appointment = await DoctorAppointment.findOne({
            _id: appointmentId,
            patient: userId,
            status: 'completed'
        })
        .populate('doctor', 'name email phone')
        .populate('clinic');

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        res.status(200).json({
            appointment,
            prescription: appointment.prescription
        });
    } catch (error) {
        console.error('Get prescription error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getLabReport = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const { testId } = req.params;

        const labTest = await LabAppointment.findOne({
            _id: testId,
            patient: userId,
            status: { $in: ['completed', 'marked-as-read'] }
        })
        .populate('lab', 'name email phone')
        .populate('laboratoryService');

        if (!labTest) {
            res.status(404).json({ message: "Lab test not found or access denied" });
            return;
        }

        res.status(200).json({
            labTest,
            report: labTest.reportResult
        });
    } catch (error) {
        console.error('Get lab report error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getLabReportPdfs = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const { testId } = req.params;

        const labTest = await LabAppointment.findOne({
            _id: testId,
            patient: userId,
            status: { $in: ['completed', 'marked-as-read'] }
        })
        .populate('lab', 'name email phone')
        .populate('laboratoryService');

        if (!labTest) {
            res.status(404).json({ message: "Lab test not found or access denied" });
            return;
        }

        res.status(200).json({
            labTest: {
                _id: labTest._id,
                providerName: (labTest.lab as any)?.name,
                serviceName: (labTest.laboratoryService as any)?.name,
                timeSlot: labTest.timeSlot
            },
            testReportPdfs: labTest.testReportPdfs || []
        });
    } catch (error) {
        console.error('Get lab report PDFs error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getLabNotes = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const { testId } = req.params;

        const labTest = await LabAppointment.findOne({
            _id: testId,
            patient: userId,
            status: { $in: ['completed', 'marked-as-read'] }
        })
        .populate('lab', 'name email phone')
        .populate('laboratoryService');

        if (!labTest) {
            res.status(404).json({ message: "Lab test not found or access denied" });
            return;
        }

        res.status(200).json({
            labTest: {
                _id: labTest._id,
                providerName: (labTest.lab as any)?.name,
                serviceName: (labTest.laboratoryService as any)?.name,
                timeSlot: labTest.timeSlot
            },
            notes: labTest.notes || 'No additional notes available'
        });
    } catch (error) {
        console.error('Get lab notes error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getCollectedSamples = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Get lab appointments with collected status (sample collected, in processing)
        const collectedSamples = await LabAppointment.find({
            patient: userId,
            status: { $in: ['collected', 'processing'] }
        })
        .populate('lab', 'name email phone')
        .populate('laboratoryService')
        .sort({ timeSlot: -1 })
        .skip(skip)
        .limit(limit);

        const totalCollectedSamples = await LabAppointment.countDocuments({
            patient: userId,
            status: { $in: ['collected', 'processing'] }
        });

        // Populate laboratory profiles for lab names
        for (let i = 0; i < collectedSamples.length; i++) {
            const sample = collectedSamples[i];
            const labUser = sample?.lab;
            if (labUser) {
                try {
                    const labProfile = await LaboratoryProfile.findOne({ user: (labUser as any)._id });
                    if (labProfile) {
                        if (labProfile.laboratoryName) {
                            (sample.lab as any).laboratoryName = labProfile.laboratoryName;
                        }
                        // Add laboratory profile ID for rating purposes
                        (sample.lab as any).profileId = labProfile._id;
                    }
                } catch (error) {
                    console.log('Error fetching lab profile:', error);
                }
            }
        }

        // Format collected samples for response
        const formattedSamples = collectedSamples.map(sample => {
            const sampleObj = sample.toObject();
            return {
                ...sampleObj,
                type: 'laboratory',
                providerName: (sample.lab as any)?.laboratoryName || (sample.lab as any)?.name,
                serviceName: (sample.laboratoryService as any)?.name,
                packageCoverImage: (sample.laboratoryService as any)?.coverImage,
                timeSlotDisplay: formatDateToDisplayString(sample.timeSlot)
            };
        });

        const totalPages = Math.ceil(totalCollectedSamples / limit);

        res.status(200).json({
            labTests: formattedSamples,
            pagination: {
                current: page,
                total: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            totalCollected: totalCollectedSamples
        });
    } catch (error) {
        console.error('Get collected samples error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

export { 
    getUserDashboard, 
    getPreviousAppointments, 
    getPreviousLabTests, 
    getAppointmentPrescription, 
    getLabReport,
    getLabReportPdfs,
    getLabNotes,
    getCollectedSamples
}; 