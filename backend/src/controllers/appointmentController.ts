import type { Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import DoctorAppointment from "../models/doctorAppointments";
import LabAppointment from "../models/labAppointments";
import Clinic from "../models/clinicModel";
import LaboratoryService from "../models/laboratoryServiceModel";
import { DoctorProfile } from "../models/profileModel";
import { scheduleAppointmentReminders } from "../utils/appointmentReminders";

// Helper function to convert timeSlot string to IST Date
const parseTimeSlotToISTDate = (timeSlotString: string): Date => {
    try {
        // Parse format like "Monday 9:00 AM-10:00 AM" to get start time
        const parts = timeSlotString.split(' ');
        if (parts.length >= 3) {
            const dayName = parts[0];
            const timeRange = parts.slice(1).join(' ');
            const startTime = timeRange.split('-')[0]?.trim(); // "9:00 AM"
            
            if (!dayName || !startTime) throw new Error('Invalid format');
            
            // Get the date for this day of the week in IST
            const now = new Date();
            // Convert current time to IST first
            const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
            
            const currentDay = istNow.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const targetDay = dayNames.indexOf(dayName);
            
            if (targetDay !== -1) {
                // Calculate days difference
                let daysDiff = targetDay - currentDay;
                if (daysDiff < 0) daysDiff += 7; // Next week
                
                // Create appointment date in IST
                const appointmentDate = new Date(istNow);
                appointmentDate.setDate(istNow.getDate() + daysDiff);
                
                // Parse the start time
                const timeMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/);
                if (timeMatch && timeMatch[1] && timeMatch[2] && timeMatch[3]) {
                    let hour = parseInt(timeMatch[1]);
                    const minute = parseInt(timeMatch[2]);
                    const period = timeMatch[3];
                    
                    // Convert to 24-hour format
                    if (period === 'PM' && hour !== 12) hour += 12;
                    if (period === 'AM' && hour === 12) hour = 0;
                    
                    // Set time directly (already in IST context)
                    appointmentDate.setHours(hour, minute, 0, 0);
                    
                    // Convert back to UTC for storage (subtract IST offset)
                    const utcDate = new Date(appointmentDate.getTime() - (5.5 * 60 * 60 * 1000));
                    
                    return utcDate;
                }
            }
        }
        
        throw new Error('Invalid time slot format');
    } catch (error) {
        console.error('Error parsing time slot:', error);
        throw new Error('Invalid time slot format');
    }
};

const bookAppointmentDoctor = async (req: CustomRequest, res: Response) => {
    try {
        const { doctorId, timeSlot, consultationType, clinicId } = req.body;
        const userId = req.user._id;
        
        // Convert string timeSlot to Date object in IST
        const appointmentDateTime = parseTimeSlotToISTDate(timeSlot);
        
        // Debug logging
        console.log('Original timeSlot string:', timeSlot);
        console.log('Parsed appointment date (UTC for storage):', appointmentDateTime);
        console.log('Appointment date in IST (for verification):', new Date(appointmentDateTime.getTime() + (5.5 * 60 * 60 * 1000)));
        
        const appointmentData: any = { 
            doctor: doctorId, 
            patient: userId,
            timeSlot: appointmentDateTime, 
            consultationType,
        };

        // Fetch doctor's profile to get consultationFee
        const doctorProfile = await DoctorProfile.findOne({ user: doctorId });
        if (doctorProfile && doctorProfile.consultationFee != null) {
            appointmentData.consultationFee = doctorProfile.consultationFee;
        }

        // Add clinic reference if it's an in-person consultation and clinicId is provided
        if (consultationType === 'in-person' && clinicId) {
            // Verify clinic belongs to the doctor
            const clinic = await Clinic.findOne({ _id: clinicId, doctor: doctorId });
            if (!clinic) {
                res.status(400).json({ message: "Invalid clinic selection" });
                return;
            }
            appointmentData.clinic = clinicId;
        }
        
        const appointment = await DoctorAppointment.create(appointmentData);
        
        // Schedule reminders
        await scheduleAppointmentReminders(appointment._id.toString(), appointmentDateTime.toISOString(), 'doctor');
        
        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error });
    }
};

const bookLabAppointment = async (req: CustomRequest, res: Response) => {
    try {
        const { labId, timeSlot, collectionType, serviceId, selectedTests } = req.body;
        const userId = req.user._id;
        
        // Convert string timeSlot to Date object in IST
        const appointmentDateTime = parseTimeSlotToISTDate(timeSlot);
        
        // Debug logging
        console.log('Lab - Original timeSlot string:', timeSlot);
        console.log('Lab - Parsed appointment date (UTC for storage):', appointmentDateTime);
        console.log('Lab - Appointment date in IST (for verification):', new Date(appointmentDateTime.getTime() + (5.5 * 60 * 60 * 1000)));
        
        // Verify laboratory service belongs to the lab
        const service = await LaboratoryService.findOne({ _id: serviceId, laboratory: labId });
        if (!service) {
            res.status(400).json({ message: "Invalid service selection" });
            return;
        }

        const appointmentData: any = {
            lab: labId, 
            patient: userId,
            timeSlot: appointmentDateTime, 
            collectionType, 
            laboratoryService: serviceId,
            selectedTests: selectedTests || []
        };
        if (service && service.price != null) {
            appointmentData.serviceFee = service.price;
        }
        const appointment = await LabAppointment.create(appointmentData);
        
        // Schedule reminders
        await scheduleAppointmentReminders(appointment._id.toString(), appointmentDateTime.toISOString(), 'lab');
        
        res.status(201).json(appointment);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", error: error });
    }
};

const cancelAppointment = async (req: CustomRequest, res: Response) => {
    try {
        const { appointmentId, appointmentType } = req.params;
        const userId = req.user._id;

        let appointment;
        if (appointmentType === 'doctor') {
            appointment = await DoctorAppointment.findOne({
                _id: appointmentId,
                patient: userId,
                status: 'upcoming'
            });
        } else if (appointmentType === 'laboratory') {
            appointment = await LabAppointment.findOne({
                _id: appointmentId,
                patient: userId,
                status: { $in: ['pending', 'upcoming'] }
            });
        }

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found or cannot be cancelled" });
        }

        // Delete the appointment
        if (appointmentType === 'doctor') {
            await DoctorAppointment.deleteOne({ _id: appointmentId });
        } else {
            await LabAppointment.deleteOne({ _id: appointmentId });
        }

        res.status(200).json({ message: "Appointment cancelled successfully" });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const rescheduleAppointment = async (req: CustomRequest, res: Response) => {
    try {
        const { appointmentId, appointmentType } = req.params;
        const { timeSlot } = req.body;
        const userId = req.user._id;

        // Convert string timeSlot to Date object in IST
        const appointmentDateTime = parseTimeSlotToISTDate(timeSlot);

        let appointment;
        if (appointmentType === 'doctor') {
            appointment = await DoctorAppointment.findOne({
                _id: appointmentId,
                patient: userId,
                status: 'upcoming'
            });
        } else if (appointmentType === 'laboratory') {
            appointment = await LabAppointment.findOne({
                _id: appointmentId,
                patient: userId,
                status: { $in: ['pending', 'upcoming'] }
            });
        }

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found or cannot be rescheduled" });
        }

        // Update the appointment time
        appointment.timeSlot = appointmentDateTime;
        await appointment.save();

        // Schedule new reminders
        await scheduleAppointmentReminders(appointment._id.toString(), appointmentDateTime.toISOString(), appointmentType === 'doctor' ? 'doctor' : 'lab');

        res.status(200).json({ 
            message: "Appointment rescheduled successfully",
            appointment
        });
    } catch (error) {
        console.error('Reschedule appointment error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

export { bookAppointmentDoctor, bookLabAppointment, cancelAppointment, rescheduleAppointment };