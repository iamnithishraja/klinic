import { Router } from "express";
import { bookAppointmentDoctor, bookLabAppointment, cancelAppointment, rescheduleAppointment } from "../controllers/appointmentController";
import { isAuthenticatedUser } from "../middlewares/auth";

const router = Router();

router.post('/book-appointment-doctor', isAuthenticatedUser, bookAppointmentDoctor);
router.post('/book-appointment-lab', isAuthenticatedUser, bookLabAppointment);
router.delete('/:appointmentType/:appointmentId', isAuthenticatedUser, cancelAppointment);
router.put('/:appointmentType/:appointmentId/reschedule', isAuthenticatedUser, rescheduleAppointment);

export default router;