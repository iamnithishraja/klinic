import type { Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import DoctorAppointment from "../models/doctorAppointments";
import LabAppointment from "../models/labAppointments";
import Clinic from "../models/clinicModel";
import LaboratoryService from "../models/laboratoryServiceModel";
import { DoctorProfile, LaboratoryProfile } from "../models/profileModel";
import User from "../models/userModel";

// Helper function to parse timeSlot string to Date for proper sorting
const parseTimeSlotToDate = (timeSlot: string): Date => {
    try {
        // Parse format like "Monday 9:00 AM-10:00 AM"
        const parts = timeSlot.split(' ');
        if (parts.length >= 3) {
            const dayName = parts[0];
            const timeRange = parts.slice(1).join(' ');
            const startTime = timeRange.split('-')[0]?.trim(); // "9:00 AM"
            
            if (!dayName || !startTime) return new Date();
            
            // Get the date for this day of the week
            const today = new Date();
            const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const targetDay = dayNames.indexOf(dayName);
            
            if (targetDay !== -1) {
                // Calculate days difference
                let daysDiff = targetDay - currentDay;
                if (daysDiff < 0) daysDiff += 7; // Next week
                
                const appointmentDate = new Date(today);
                appointmentDate.setDate(today.getDate() + daysDiff);
                
                // Parse the start time
                const timeMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/);
                if (timeMatch && timeMatch[1] && timeMatch[2] && timeMatch[3]) {
                    let hour = parseInt(timeMatch[1]);
                    const minute = parseInt(timeMatch[2]);
                    const period = timeMatch[3];
                    
                    // Convert to 24-hour format
                    if (period === 'PM' && hour !== 12) hour += 12;
                    if (period === 'AM' && hour === 12) hour = 0;
                    
                    appointmentDate.setHours(hour, minute, 0, 0);
                    return appointmentDate;
                }
            }
        }
        
        // Fallback - return current date
        return new Date();
    } catch {
        return new Date();
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
                    if (doctorProfile?.coverImage) {
                        (appointment.doctor as any).coverImage = doctorProfile.coverImage;
                    }
                } catch (error) {
                    console.log('Error fetching doctor profile:', error);
                }
            }
        }

        // Get upcoming lab appointments
        const upcomingLabAppointments = await LabAppointment.find({
            patient: userId,
            status: 'upcoming'
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
                    serviceName: 'Doctor Consultation'
                };
            }),
            ...upcomingLabAppointments.map(apt => {
                const appointmentObj = apt.toObject();
                return {
                    ...appointmentObj,
                    type: 'lab',
                    providerName: (apt.lab as any)?.laboratoryName || (apt.lab as any)?.name,
                    serviceName: (apt.laboratoryService as any)?.name,
                    // Use package cover image from laboratoryService
                    packageCoverImage: (apt.laboratoryService as any)?.coverImage
                };
            })
        ].sort((a, b) => parseTimeSlotToDate(a.timeSlot).getTime() - parseTimeSlotToDate(b.timeSlot).getTime());

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
                    if (doctorProfile?.coverImage) {
                        (appointment.doctor as any).coverImage = doctorProfile.coverImage;
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
                    providerName: (apt.doctor as any)?.name
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

        // Get previous lab appointments
        const previousLabTests = await LabAppointment.find({
            patient: userId,
            status: 'completed'
        })
        .populate('lab', 'name email phone')
        .populate('laboratoryService')
        .sort({ timeSlot: -1 })
        .skip(skip)
        .limit(limit);

        const totalPreviousTests = await LabAppointment.countDocuments({
            patient: userId,
            status: 'completed'
        });

        // Populate laboratory profiles for lab names only (cover image comes from laboratoryService)
        for (let i = 0; i < previousLabTests.length; i++) {
            const test = previousLabTests[i];
            const labUser = test?.lab;
            if (labUser) {
                try {
                    const labProfile = await LaboratoryProfile.findOne({ user: (labUser as any)._id });
                    if (labProfile?.laboratoryName) {
                        (test.lab as any).laboratoryName = labProfile.laboratoryName;
                    }
                } catch (error) {
                    console.log('Error fetching lab profile:', error);
                }
            }
        }

        res.status(200).json({
            labTests: previousLabTests.map(test => {
                const testObj = test.toObject();
                return {
                    ...testObj,
                    type: 'lab',
                    providerName: (test.lab as any)?.laboratoryName || (test.lab as any)?.name,
                    // Use package cover image from laboratoryService
                    packageCoverImage: (test.laboratoryService as any)?.coverImage
                };
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
            status: 'completed'
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

export { 
    getUserDashboard, 
    getPreviousAppointments, 
    getPreviousLabTests, 
    getAppointmentPrescription, 
    getLabReport 
}; 