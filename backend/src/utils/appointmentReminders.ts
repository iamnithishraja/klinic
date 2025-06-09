import { Resend } from "resend";
import axios from "axios";
import User from "../models/userModel";
import DoctorAppointment from "../models/doctorAppointments";
import LabAppointment from "../models/labAppointments";
import { DoctorProfile, LaboratoryProfile } from "../models/profileModel";

const resend = new Resend(process.env.RESEND_API_KEY);

// Parse different time slot formats
const parseTimeSlot = (timeSlot: string): Date => {
    try {
        // Handle formats like "Monday 09:30" or "Tuesday 2:00 PM-3:00 PM"
        const parts = timeSlot.trim().split(' ');
        const dayName = parts[0];
        const timeStr = parts.slice(1).join(' ');
        
        // Get the current date and find the next occurrence of the specified day
        const today = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDayIndex = days.indexOf(dayName || '');
        
        if (targetDayIndex === -1) {
            throw new Error('Invalid day name');
        }
        
        const currentDayIndex = today.getDay();
        let daysUntilTarget = targetDayIndex - currentDayIndex;
        
        // If the target day is today or has passed this week, schedule for next week
        if (daysUntilTarget <= 0) {
            daysUntilTarget += 7;
        }
        
        const appointmentDate = new Date(today);
        appointmentDate.setDate(today.getDate() + daysUntilTarget);
        
        // Parse time - handle both "09:30" and "2:00 PM-3:00 PM" formats
        let hour = 9;
        let minute = 0;
        
        if (timeStr.includes('PM') || timeStr.includes('AM')) {
            // Handle "2:00 PM-3:00 PM" format - take the start time
            const startTime = timeStr.split('-')[0]?.trim();
            const timeMatch = startTime?.match(/(\d+):(\d+)\s*(AM|PM)/);
            if (timeMatch) {
                hour = parseInt(timeMatch[1] || '0');
                minute = parseInt(timeMatch[2] || '0');
                const period = timeMatch[3] || '';
                
                if (period === 'PM' && hour !== 12) hour += 12;
                if (period === 'AM' && hour === 12) hour = 0;
            }
        } else {
            // Handle "09:30" format
            const timeMatch = timeStr?.match(/(\d+):(\d+)/);
            if (timeMatch) {
                hour = parseInt(timeMatch[1] || '0');
                minute = parseInt(timeMatch[2] || '0');
            }
        }
        
        appointmentDate.setHours(hour, minute, 0, 0);
        return appointmentDate;
    } catch (error) {
        console.error('Error parsing time slot:', error);
        // Fallback to tomorrow at 9 AM if parsing fails
        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 1);
        fallback.setHours(9, 0, 0, 0);
        return fallback;
    }
};

const sendReminderEmail = async (email: string, subject: string, message: string) => {
    try {
        const { error } = await resend.emails.send({
            from: 'Klinic Reminders <reminders@klinic.com>',
            to: email,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Appointment Reminder</h2>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
                        ${message.split('\n').map(line => `<p style="margin: 5px 0;">${line}</p>`).join('')}
                    </div>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                        Best regards,<br/>
                        Klinic Team
                    </p>
                </div>
            `,
        });
        
        if (error) {
            throw error;
        }
        
        console.log(`Reminder email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending reminder email:', error);
        return false;
    }
};

const sendReminderSMS = async (phone: string, message: string) => {
    try {
        const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${phone}/${encodeURIComponent(message)}`;
        const response = await axios.get(url);
        
        if (response.status === 200) {
            console.log(`Reminder SMS sent to ${phone}`);
            return true;
        } else {
            throw new Error('Failed to send SMS');
        }
    } catch (error) {
        console.error('Error sending reminder SMS:', error);
        return false;
    }
};

const send24HourReminder = async (appointmentId: string, appointmentType: 'doctor' | 'lab') => {
    try {
        let appointment;
        let patient;
        let provider;
        let serviceDetails = '';
        
        if (appointmentType === 'doctor') {
            appointment = await DoctorAppointment.findById(appointmentId)
                .populate('patient')
                .populate('doctor');
            
            if (!appointment) return;
            
            patient = appointment.patient;
            provider = await DoctorProfile.findById(appointment.doctor).populate('user');
            serviceDetails = `Consultation with Dr. ${(provider?.user as any)?.name || 'Doctor'}
Type: ${appointment.consultationType}`;
        } else {
            appointment = await LabAppointment.findById(appointmentId)
                .populate('patient')
                .populate('lab');
            
            if (!appointment) return;
            
            patient = appointment.patient;
            provider = await LaboratoryProfile.findById(appointment.lab).populate('user');
            serviceDetails = `Laboratory Service at ${provider?.laboratoryName || 'Laboratory'}
Collection: ${appointment.collectionType === 'lab' ? 'Lab Visit' : 'Home Collection'}`;
        }
        
        if (!patient || !provider) return;
        
        const subject = '24-Hour Appointment Reminder';
        const message = `This is a reminder that you have an appointment scheduled for tomorrow.

${serviceDetails}
Date & Time: ${appointment.timeSlot}

Please make sure to be available at the scheduled time. For any changes or queries, please contact us.`;

        // Send email and SMS reminders
        await Promise.all([
            sendReminderEmail((patient as any).email, subject, message),
            sendReminderSMS((patient as any).phone, `Reminder: You have an appointment tomorrow. ${appointment.timeSlot}. ${serviceDetails.split('\n')[0]}`)
        ]);
        
    } catch (error) {
        console.error('Error sending 24-hour reminder:', error);
    }
};

const send1HourReminder = async (appointmentId: string, appointmentType: 'doctor' | 'lab') => {
    try {
        let appointment;
        let patient;
        let provider;
        let serviceDetails = '';
        
        if (appointmentType === 'doctor') {
            appointment = await DoctorAppointment.findById(appointmentId)
                .populate('patient')
                .populate('doctor');
            
            if (!appointment) return;
            
            patient = appointment.patient;
            provider = await DoctorProfile.findById(appointment.doctor).populate('user');
            serviceDetails = `consultation with Dr. ${(provider?.user as any)?.name || 'Doctor'}`;
        } else {
            appointment = await LabAppointment.findById(appointmentId)
                .populate('patient')
                .populate('lab');
            
            if (!appointment) return;
            
            patient = appointment.patient;
            provider = await LaboratoryProfile.findById(appointment.lab).populate('user');
            serviceDetails = `laboratory appointment at ${provider?.laboratoryName || 'Laboratory'}`;
        }
        
        if (!patient || !provider) return;
        
        const subject = '1-Hour Appointment Reminder';
        const message = `Your appointment is starting in 1 hour!

${serviceDetails}
Time: ${appointment.timeSlot}

Please be ready and arrive on time. Thank you!`;

        // Send email and SMS reminders
        await Promise.all([
            sendReminderEmail((patient as any).email, subject, message),
            sendReminderSMS((patient as any).phone, `Reminder: Your ${serviceDetails} starts in 1 hour at ${appointment.timeSlot}. Please be ready!`)
        ]);
        
    } catch (error) {
        console.error('Error sending 1-hour reminder:', error);
    }
};

const scheduleAppointmentReminders = async (appointmentId: string, timeSlot: string, appointmentType: 'doctor' | 'lab') => {
    try {
        const appointmentDate = parseTimeSlot(timeSlot);
        const now = new Date();
        
        // Calculate reminder times
        const reminderTime24h = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
        const reminderTime1h = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
        
        // Schedule 24-hour reminder if it's in the future
        if (reminderTime24h > now) {
            const delay24h = reminderTime24h.getTime() - now.getTime();
            setTimeout(() => {
                send24HourReminder(appointmentId, appointmentType);
            }, delay24h);
            
            console.log(`24-hour reminder scheduled for appointment ${appointmentId} at ${reminderTime24h}`);
        }
        
        // Schedule 1-hour reminder if it's in the future
        if (reminderTime1h > now) {
            const delay1h = reminderTime1h.getTime() - now.getTime();
            setTimeout(() => {
                send1HourReminder(appointmentId, appointmentType);
            }, delay1h);
            
            console.log(`1-hour reminder scheduled for appointment ${appointmentId} at ${reminderTime1h}`);
        }
        
    } catch (error) {
        console.error('Error scheduling appointment reminders:', error);
    }
};

export { scheduleAppointmentReminders, send24HourReminder, send1HourReminder }; 