import type { Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import LabAppointment from "../models/labAppointments";
import { LaboratoryProfile, UserProfile } from "../models/profileModel";
import LaboratoryService from "../models/laboratoryServiceModel";
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

const getLaboratoryDashboard = async (req: CustomRequest, res: Response) => {
    try {
        const laboratoryId = req.user._id;
        console.log('Laboratory Dashboard - Laboratory ID:', laboratoryId);
        console.log('Laboratory Dashboard - User:', req.user);
        
        // Get all appointments for this laboratory first to debug
        const allAppointments = await LabAppointment.find({ lab: laboratoryId });
        console.log('All appointments for laboratory:', allAppointments.length);
        console.log('All appointments:', allAppointments.map(apt => ({ id: apt._id, status: apt.status, patient: apt.patient })));
        
        // Get pending appointments (patient uploaded details, not yet processed)
        // Handle both old 'upcoming' and new 'pending' status during transition
        const pendingAppointments = await LabAppointment.find({
            lab: laboratoryId,
            status: { $in: ['pending', 'upcoming'] }
        })
        .populate('patient', 'name email phone profilePicture age gender')
        .populate('laboratoryService')
        .sort({ timeSlot: 1 });

        console.log('Pending appointments found:', pendingAppointments.length);

        // Get processing appointments (tests in progress, sample collected but report not uploaded)
        // Also include completed appointments that haven't been marked as read yet
        // Handle both old 'collected' and new 'processing' status during transition
        const processingAppointments = await LabAppointment.find({
            lab: laboratoryId,
            status: { $in: ['processing', 'collected', 'completed'] }
        })
        .populate('patient', 'name email phone profilePicture age gender')
        .populate('laboratoryService')
        .sort({ timeSlot: 1 });

        console.log('Processing appointments found:', processingAppointments.length);

        // Get completed appointments (test reports uploaded and marked as read)
        const completedAppointments = await LabAppointment.find({
            lab: laboratoryId,
            status: 'marked-as-read'
        })
        .populate('patient', 'name email phone profilePicture age gender')
        .populate('laboratoryService')
        .sort({ timeSlot: -1 })
        .limit(10);

        console.log('Completed appointments found:', completedAppointments.length);

        // Populate patient profiles with additional data
        const populatePatientProfiles = async (appointments: any[]) => {
            for (let i = 0; i < appointments.length; i++) {
                const appointment = appointments[i];
                const patientUser = appointment?.patient;
                if (patientUser) {
                    try {
                        const userProfile = await UserProfile.findOne({ user: (patientUser as any)._id });
                        console.log('Found user profile for patient:', (patientUser as any)._id, userProfile ? 'Yes' : 'No');
                        if (userProfile) {
                            console.log('User profile data:', {
                                age: userProfile.age,
                                gender: userProfile.gender,
                                medicalHistory: userProfile.medicalHistory,
                                medicalHistoryPdfs: userProfile.medicalHistoryPdfs,
                                address: userProfile.address,
                                city: userProfile.city
                            });
                            // Merge profile data with patient data
                            (appointment.patient as any).profilePicture = userProfile.profilePicture;
                            (appointment.patient as any).age = userProfile.age;
                            (appointment.patient as any).gender = userProfile.gender;
                            (appointment.patient as any).medicalHistory = userProfile.medicalHistory;
                            (appointment.patient as any).medicalHistoryPdfs = userProfile.medicalHistoryPdfs;
                            (appointment.patient as any).address = userProfile.address;
                            (appointment.patient as any).city = userProfile.city;
                            (appointment.patient as any).createdAt = userProfile.createdAt;
                            (appointment.patient as any).updatedAt = userProfile.updatedAt;
                        } else {
                            console.log('No user profile found for patient:', (patientUser as any)._id);
                        }
                    } catch (error) {
                        console.log('Error fetching patient profile:', error);
                    }
                }
            }
        };

        // Populate patient profiles for all appointment types
        await populatePatientProfiles(pendingAppointments);
        await populatePatientProfiles(processingAppointments);
        await populatePatientProfiles(completedAppointments);

        // Format appointments for response
        const formatAppointments = async (appointments: any[]) => {
            const formatted = [];
            for (const apt of appointments) {
                const appointmentObj = apt.toObject();
                // Fetch and merge user profile fields into the plain object
                if (appointmentObj.patient && appointmentObj.patient._id) {
                    try {
                        const userProfile = await UserProfile.findOne({ user: appointmentObj.patient._id });
                        if (userProfile) {
                            appointmentObj.patient.profilePicture = userProfile.profilePicture;
                            appointmentObj.patient.age = userProfile.age;
                            appointmentObj.patient.gender = userProfile.gender;
                            appointmentObj.patient.medicalHistory = userProfile.medicalHistory;
                            appointmentObj.patient.medicalHistoryPdfs = userProfile.medicalHistoryPdfs;
                            appointmentObj.patient.address = userProfile.address;
                            appointmentObj.patient.city = userProfile.city;
                            appointmentObj.patient.createdAt = userProfile.createdAt;
                            appointmentObj.patient.updatedAt = userProfile.updatedAt;
                        }
                    } catch (error) {
                        console.log('Error fetching user profile for patient:', appointmentObj.patient._id, error);
                    }
                }
                appointmentObj.timeSlotDisplay = formatDateToDisplayString(apt.timeSlot);
                formatted.push(appointmentObj);
            }
            return formatted;
        };

        res.status(200).json({
            pendingAppointments: await formatAppointments(pendingAppointments),
            processingAppointments: await formatAppointments(processingAppointments),
            completedAppointments: await formatAppointments(completedAppointments),
            totalPending: pendingAppointments.length,
            totalProcessing: processingAppointments.length,
            totalCompleted: completedAppointments.length,
            totalAppointments: allAppointments.length
        });
    } catch (error) {
        console.error('Laboratory dashboard error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const addLabReport = async (req: CustomRequest, res: Response) => {
    try {
        const laboratoryId = req.user._id;
        const { appointmentId } = req.params;
        const { reportResult, notes, testReportPdfs } = req.body;

        if (!reportResult || reportResult.trim() === '') {
            res.status(400).json({ message: "Lab report is required" });
            return;
        }

        // Verify appointment belongs to this laboratory
        const appointment = await LabAppointment.findOne({
            _id: appointmentId,
            lab: laboratoryId
        });

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        // Update appointment with report and PDFs
        appointment.reportResult = reportResult.trim();
        appointment.notes = notes || null;
        appointment.testReportPdfs = testReportPdfs || [];
        appointment.reportsUploaded = true;
        
        // Check if both report details and PDFs are complete, then move to completed
        const hasReportDetails = appointment.reportResult && appointment.reportResult.trim() !== '';
        const hasPdfs = appointment.testReportPdfs && appointment.testReportPdfs.length > 0;
        
        if (hasReportDetails && hasPdfs) {
          appointment.status = 'completed'; // Move to completed when all reports are uploaded
        } else {
          appointment.status = 'processing'; // Keep in processing if reports are incomplete
        }
        
        await appointment.save();

        res.status(200).json({ 
            message: "Lab report and test PDFs uploaded successfully",
            appointment: {
                ...appointment.toObject(),
                timeSlotDisplay: formatDateToDisplayString(appointment.timeSlot)
            }
        });
    } catch (error) {
        console.error('Add lab report error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const deleteLabReport = async (req: CustomRequest, res: Response) => {
    try {
        const laboratoryId = req.user._id;
        const { appointmentId } = req.params;

        // Verify appointment belongs to this laboratory
        const appointment = await LabAppointment.findOne({
            _id: appointmentId,
            lab: laboratoryId
        });

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        // Check if appointment has reports to delete
        if (!appointment.reportResult && (!appointment.testReportPdfs || appointment.testReportPdfs.length === 0)) {
            res.status(400).json({ message: "No reports found to delete" });
            return;
        }

        // Clear all report data
        appointment.reportResult = null;
        appointment.notes = null;
        appointment.testReportPdfs = [];
        appointment.reportsUploaded = false;
        appointment.status = 'processing'; // Move back to processing status
        await appointment.save();

        res.status(200).json({ 
            message: "Lab report deleted successfully. Appointment moved back to processing.",
            appointment: {
                ...appointment.toObject(),
                timeSlotDisplay: formatDateToDisplayString(appointment.timeSlot)
            }
        });
    } catch (error) {
        console.error('Delete lab report error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const markAsRead = async (req: CustomRequest, res: Response) => {
    try {
        const laboratoryId = req.user._id;
        const { appointmentId } = req.params;

        // Verify appointment belongs to this laboratory
        const appointment = await LabAppointment.findOne({
            _id: appointmentId,
            lab: laboratoryId
        });

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        console.log('Mark as read - Collection type:', appointment.collectionType);
        console.log('Mark as read - Current isPaid status:', appointment.isPaid);

        // Update appointment status to marked-as-read
        appointment.status = 'marked-as-read';
        
        // For lab visits, automatically mark as paid since payment is collected at the time of service
        if (appointment.collectionType === 'lab' && !appointment.isPaid) {
            appointment.isPaid = true;
            console.log('Mark as read - Marked lab visit as paid');
        }
        
        await appointment.save();

        res.status(200).json({ 
            message: "Appointment marked as read successfully",
            appointment: {
                ...appointment.toObject(),
                timeSlotDisplay: formatDateToDisplayString(appointment.timeSlot)
            }
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getAppointmentDetails = async (req: CustomRequest, res: Response) => {
    try {
        const laboratoryId = req.user._id;
        const { appointmentId } = req.params;

        const appointment = await LabAppointment.findOne({
            _id: appointmentId,
            lab: laboratoryId
        })
        .populate('patient', 'name email phone profilePicture age gender')
        .populate('laboratoryService');

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        // Fetch and merge user profile data
        const appointmentObj = appointment.toObject();
        if (appointmentObj.patient && appointmentObj.patient._id) {
            try {
                const userProfile = await UserProfile.findOne({ user: appointmentObj.patient._id });
                if (userProfile) {
                    appointmentObj.patient.profilePicture = userProfile.profilePicture;
                    appointmentObj.patient.age = userProfile.age;
                    appointmentObj.patient.gender = userProfile.gender;
                    appointmentObj.patient.medicalHistory = userProfile.medicalHistory;
                    appointmentObj.patient.medicalHistoryPdfs = userProfile.medicalHistoryPdfs;
                    appointmentObj.patient.address = userProfile.address;
                    appointmentObj.patient.city = userProfile.city;
                    appointmentObj.patient.createdAt = userProfile.createdAt;
                    appointmentObj.patient.updatedAt = userProfile.updatedAt;
                }
            } catch (error) {
                console.log('Error fetching user profile for patient:', appointmentObj.patient._id, error);
            }
        }

        res.status(200).json({
            appointment: {
                ...appointmentObj,
                timeSlotDisplay: formatDateToDisplayString(appointment.timeSlot)
            }
        });
    } catch (error) {
        console.error('Get appointment details error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const updateAppointmentStatus = async (req: CustomRequest, res: Response) => {
    try {
        const laboratoryId = req.user._id;
        const { appointmentId } = req.params;
        const { status } = req.body;

        // Handle both old and new status values during transition
        const validStatuses = ['pending', 'processing', 'completed', 'marked-as-read', 'upcoming', 'collected'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: "Invalid status" });
            return;
        }

        // Verify appointment belongs to this laboratory
        const appointment = await LabAppointment.findOne({
            _id: appointmentId,
            lab: laboratoryId
        });

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        console.log('Update appointment status - Collection type:', appointment.collectionType);
        console.log('Update appointment status - Current isPaid status:', appointment.isPaid);
        console.log('Update appointment status - New status:', status);

        // Map old status values to new ones
        let newStatus = status;
        if (status === 'upcoming') newStatus = 'pending';
        if (status === 'collected') newStatus = 'processing';

        // Update appointment status
        appointment.status = newStatus;
        
        // For lab visits, automatically mark as paid when marking as completed since payment is collected at the time of service
        if ((newStatus === 'completed' || newStatus === 'marked-as-read') && 
            appointment.collectionType === 'lab' && 
            !appointment.isPaid) {
            appointment.isPaid = true;
            console.log('Update appointment status - Marked lab visit as paid');
        }
        
        await appointment.save();

        res.status(200).json({ 
            message: "Appointment status updated successfully",
            appointment: {
                ...appointment.toObject(),
                timeSlotDisplay: formatDateToDisplayString(appointment.timeSlot)
            }
        });
    } catch (error) {
        console.error('Update appointment status error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getLaboratoryServices = async (req: CustomRequest, res: Response) => {
    try {
        const laboratoryId = req.user._id;
        
        const services = await LaboratoryService.find({
            laboratory: laboratoryId,
            isActive: true
        }).sort({ createdAt: -1 });

        res.status(200).json({
            services: services.map(service => service.toObject())
        });
    } catch (error) {
        console.error('Get laboratory services error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const testLaboratoryEndpoint = async (req: CustomRequest, res: Response) => {
    try {
        res.status(200).json({ 
            message: "Laboratory endpoint working", 
            user: req.user,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

const markSampleCollected = async (req: CustomRequest, res: Response) => {
    try {
        const laboratoryId = req.user._id;
        const { appointmentId } = req.params;

        // Verify appointment belongs to this laboratory
        const appointment = await LabAppointment.findOne({
            _id: appointmentId,
            lab: laboratoryId
        });

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        // Check if appointment is in pending status
        if (appointment.status !== 'pending' && appointment.status !== 'upcoming') {
            res.status(400).json({ message: "Sample can only be marked as collected for pending appointments" });
            return;
        }

        // Update appointment status to processing
        appointment.status = 'processing';
        await appointment.save();

        res.status(200).json({ 
            message: "Sample marked as collected successfully",
            appointment: {
                ...appointment.toObject(),
                timeSlotDisplay: formatDateToDisplayString(appointment.timeSlot)
            }
        });
    } catch (error) {
        console.error('Mark sample collected error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getLaboratoryAvailability = async (req: CustomRequest, res: Response) => {
    try {
        const { laboratoryId } = req.params;
        const laboratoryProfile = await LaboratoryProfile.findOne({ user: laboratoryId });
        
        if (!laboratoryProfile) {
            return res.status(404).json({ message: "Laboratory profile not found" });
        }

        res.status(200).json({
            availableDays: laboratoryProfile.availableDays || [],
            availableSlots: laboratoryProfile.availableSlots || []
        });
    } catch (error) {
        console.error('Error fetching laboratory availability:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const cancelAppointment = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const laboratoryId = req.user._id;
        const { appointmentId } = req.params;

        console.log('Cancel appointment - Laboratory ID:', laboratoryId);
        console.log('Cancel appointment - Appointment ID:', appointmentId);

        // Verify appointment belongs to this laboratory
        const appointment = await LabAppointment.findOne({
            _id: appointmentId,
            lab: laboratoryId,
            status: { $in: ['pending', 'upcoming'] }
        });

        console.log('Cancel appointment - Found appointment:', appointment ? 'Yes' : 'No');

        if (!appointment) {
            console.log('Cancel appointment - Appointment not found or access denied');
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        // Delete the appointment
        await LabAppointment.deleteOne({ _id: appointmentId });

        console.log('Cancel appointment - Successfully deleted');

        res.status(200).json({ 
            message: "Appointment cancelled successfully"
        });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

export { 
    getLaboratoryDashboard, 
    addLabReport, 
    deleteLabReport,
    markAsRead,
    getAppointmentDetails, 
    updateAppointmentStatus,
    getLaboratoryServices,
    testLaboratoryEndpoint,
    markSampleCollected,
    getLaboratoryAvailability,
    cancelAppointment
}; 