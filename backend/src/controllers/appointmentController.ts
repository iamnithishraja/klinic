import type { Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import DoctorAppointment from "../models/doctorAppointments";
import LabAppointment from "../models/labAppointments";
import { scheduleAppointmentReminders } from "../utils/appointmentReminders";

const bookAppointmentDoctor = async (req: CustomRequest, res: Response) => {
    try {
        const { doctorId, timeSlot, consultationType, clinicIndex } = req.body;
        const userId = req.user._id;
        
        const appointmentData = { 
            doctor: doctorId, 
            patient: userId,
            timeSlot, 
            consultationType,
            ...(consultationType === 'in-person' && clinicIndex !== undefined && { clinicIndex })
        };
        
        const appointment = await DoctorAppointment.create(appointmentData);
        
        // Schedule reminders
        await scheduleAppointmentReminders(appointment._id.toString(), timeSlot, 'doctor');
        
        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error });
    }
};

const bookLabAppointment = async (req: CustomRequest, res: Response) => {
    try {
        const { labId, timeSlot, collectionType, serviceIndex } = req.body;
        const userId = req.user._id;
        console.log(labId, timeSlot, collectionType, serviceIndex, userId);
        const appointment = await LabAppointment.create({ 
            lab: labId, 
            patient: userId,
            timeSlot, 
            collectionType, 
            serviceIndex 
        });
        
        // Schedule reminders
        await scheduleAppointmentReminders(appointment._id.toString(), timeSlot, 'lab');
        
        res.status(201).json(appointment);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", error: error });
    }
};

export { bookAppointmentDoctor, bookLabAppointment };