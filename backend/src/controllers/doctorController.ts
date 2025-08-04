import type { Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import DoctorAppointments from "../models/doctorAppointments";
import { DoctorProfile, UserProfile } from "../models/profileModel";
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

const getDoctorDashboard = async (req: CustomRequest, res: Response) => {
    try {
        const doctorId = req.user._id;
        console.log('Doctor Dashboard - Doctor ID:', doctorId);
        console.log('Doctor Dashboard - User:', req.user);
        
        // Get all appointments for this doctor first to debug
        const allAppointments = await DoctorAppointments.find({ doctor: doctorId });
        console.log('All appointments for doctor:', allAppointments.length);
        console.log('All appointments:', allAppointments.map(apt => ({ id: apt._id, status: apt.status, patient: apt.patient })));
        
        // Get pending appointments
        const pendingAppointments = await DoctorAppointments.find({
            doctor: doctorId,
            status: 'upcoming'
        })
        .populate('patient', 'name email phone')
        .populate('clinic')
        .sort({ createdAt: -1 }); // Sort by creation date, newest first

        console.log('Pending appointments found:', pendingAppointments.length);

        // Get completed appointments (last 10)
        const completedAppointments = await DoctorAppointments.find({
            doctor: doctorId,
            status: 'completed'
        })
        .populate('patient', 'name email phone')
        .populate('clinic')
        .sort({ createdAt: -1 }) // Sort by creation date, newest first
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

        // Populate patient profiles for both pending and completed appointments
        await populatePatientProfiles(pendingAppointments);
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
            completedAppointments: await formatAppointments(completedAppointments),
            totalPending: pendingAppointments.length,
            totalCompleted: completedAppointments.length,
            totalAppointments: pendingAppointments.length + completedAppointments.length
        });
    } catch (error) {
        console.error('Doctor dashboard error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const addPrescription = async (req: CustomRequest, res: Response) => {
    try {
        const doctorId = req.user._id;
        const { appointmentId } = req.params;
        const { prescription, notes } = req.body;

        if ((!prescription || prescription.trim() === '') && (!notes || notes.trim() === '')) {
            res.status(400).json({ message: "Prescription or notes is required" });
            return;
        }

        // Verify appointment belongs to this doctor
        const appointment = await DoctorAppointments.findOne({
            _id: appointmentId,
            doctor: doctorId
        });

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        // Update appointment with prescription and notes
        if (prescription && prescription.trim() !== '') {
            appointment.prescription = prescription.trim();
            appointment.prescriptionSent = true; // Mark prescription as sent
        }
        if (notes && notes.trim() !== '') {
            appointment.notes = notes.trim();
        }
        await appointment.save();

        res.status(200).json({ 
            message: "Prescription and notes added successfully",
            appointment: {
                ...appointment.toObject(),
                timeSlotDisplay: formatDateToDisplayString(appointment.timeSlot)
            }
        });
    } catch (error) {
        console.error('Add prescription error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const deletePrescription = async (req: CustomRequest, res: Response) => {
    try {
        const doctorId = req.user._id;
        const { appointmentId } = req.params;

        // Verify appointment belongs to this doctor
        const appointment = await DoctorAppointments.findOne({
            _id: appointmentId,
            doctor: doctorId
        });

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        // Delete prescription and move appointment back to pending
        appointment.prescription = '';
        appointment.prescriptionSent = false;
        appointment.status = 'upcoming'; // Move back to pending appointments
        await appointment.save();

        res.status(200).json({ 
            message: "Prescription deleted successfully. Appointment moved back to pending.",
            appointment: {
                ...appointment.toObject(),
                timeSlotDisplay: formatDateToDisplayString(appointment.timeSlot)
            }
        });
    } catch (error) {
        console.error('Delete prescription error:', error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getAppointmentDetails = async (req: CustomRequest, res: Response) => {
    try {
        const doctorId = req.user._id;
        const { appointmentId } = req.params;

        const appointment = await DoctorAppointments.findOne({
            _id: appointmentId,
            doctor: doctorId
        })
        .populate('patient', 'name email phone')
        .populate('clinic');

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        // Populate patient profile with additional data
        const patientUser = appointment?.patient;
        if (patientUser) {
            try {
                const userProfile = await UserProfile.findOne({ user: (patientUser as any)._id });
                console.log('Appointment details - Found user profile for patient:', (patientUser as any)._id, userProfile ? 'Yes' : 'No');
                if (userProfile) {
                    console.log('Appointment details - User profile data:', {
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
                    console.log('Appointment details - No user profile found for patient:', (patientUser as any)._id);
                }
            } catch (error) {
                console.log('Error fetching patient profile:', error);
            }
        }

        res.status(200).json({
            appointment: {
                ...appointment.toObject(),
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
        const doctorId = req.user._id;
        const { appointmentId } = req.params;
        const { status } = req.body;

        console.log('Update appointment status - Doctor ID:', doctorId);
        console.log('Update appointment status - Appointment ID:', appointmentId);
        console.log('Update appointment status - New Status:', status);
        console.log('Update appointment status - Request body:', req.body);

        if (!['upcoming', 'completed'].includes(status)) {
            console.log('Update appointment status - Invalid status:', status);
            res.status(400).json({ message: "Invalid status" });
            return;
        }

        // Verify appointment belongs to this doctor
        const appointment = await DoctorAppointments.findOne({
            _id: appointmentId,
            doctor: doctorId
        });

        console.log('Update appointment status - Found appointment:', appointment ? 'Yes' : 'No');

        if (!appointment) {
            console.log('Update appointment status - Appointment not found or access denied');
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        console.log('Update appointment status - Current status:', appointment.status);
        console.log('Update appointment status - Updating to:', status);
        console.log('Update appointment status - Consultation type:', appointment.consultationType);

        // Update appointment status
        appointment.status = status;
        
        // If marking as completed
        if (status === 'completed') {
          appointment.feedbackRequested = true;
            
            // For in-person consultations, automatically mark as paid since payment is collected at the time of service
            if (appointment.consultationType === 'in-person' && !appointment.isPaid) {
                appointment.isPaid = true;
                console.log('Update appointment status - Marked in-person consultation as paid');
            }
        }
        
        await appointment.save();

        console.log('Update appointment status - Successfully updated');

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

const testDoctorEndpoint = async (req: CustomRequest, res: Response) => {
    try {
        res.status(200).json({ 
            message: "Doctor endpoint working", 
            user: req.user,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getDoctorAvailability = async (req: CustomRequest, res: Response) => {
    try {
        const { doctorId } = req.params;
        const doctorProfile = await DoctorProfile.findOne({ user: doctorId });
        
        if (!doctorProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        console.log('Doctor availability:', doctorProfile.availableDays, doctorProfile.availableSlots);
        res.status(200).json({
            availableDays: doctorProfile.availableDays || [],
            availableSlots: doctorProfile.availableSlots || []
        });
    } catch (error) {
        console.error('Error fetching doctor availability:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const cancelAppointment = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const doctorId = req.user._id;
        const { appointmentId } = req.params;

        console.log('Cancel appointment - Doctor ID:', doctorId);
        console.log('Cancel appointment - Appointment ID:', appointmentId);

        // Verify appointment belongs to this doctor
        const appointment = await DoctorAppointments.findOne({
            _id: appointmentId,
            doctor: doctorId,
            status: 'upcoming'
        });

        console.log('Cancel appointment - Found appointment:', appointment ? 'Yes' : 'No');

        if (!appointment) {
            console.log('Cancel appointment - Appointment not found or access denied');
            res.status(404).json({ message: "Appointment not found or access denied" });
            return;
        }

        // Delete the appointment
        await DoctorAppointments.deleteOne({ _id: appointmentId });

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
    getDoctorDashboard, 
    addPrescription, 
    deletePrescription,
    getAppointmentDetails, 
    updateAppointmentStatus,
    testDoctorEndpoint,
    getDoctorAvailability,
    cancelAppointment
}; 