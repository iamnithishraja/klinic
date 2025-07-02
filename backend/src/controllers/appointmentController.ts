import type { Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import DoctorAppointment from "../models/doctorAppointments";
import LabAppointment from "../models/labAppointments";
import Clinic from "../models/clinicModel";
import LaboratoryService from "../models/laboratoryServiceModel";
import { scheduleAppointmentReminders } from "../utils/appointmentReminders";

const bookAppointmentDoctor = async (req: CustomRequest, res: Response) => {
    try {
        const { doctorId, timeSlot, consultationType, clinicId } = req.body;
        const userId = req.user._id;
        
        const appointmentData: any = { 
            doctor: doctorId, 
            patient: userId,
            timeSlot, 
            consultationType,
        };

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
        await scheduleAppointmentReminders(appointment._id.toString(), timeSlot, 'doctor');
        
        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error });
    }
};

const bookLabAppointment = async (req: CustomRequest, res: Response) => {
    try {
        const { labId, timeSlot, collectionType, serviceId, selectedTests } = req.body;
        const userId = req.user._id;
        
        // Verify laboratory service belongs to the lab
        const service = await LaboratoryService.findOne({ _id: serviceId, laboratory: labId });
        if (!service) {
            res.status(400).json({ message: "Invalid service selection" });
            return;
        }

        const appointment = await LabAppointment.create({ 
            lab: labId, 
            patient: userId,
            timeSlot, 
            collectionType, 
            laboratoryService: serviceId,
            selectedTests: selectedTests || []
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