import { Router } from "express";
import { bookAppointmentDoctor, bookLabAppointment } from "../controllers/appointmentController";
import { isAuthenticatedUser } from "../middlewares/auth";

const router = Router();

router.post('/book-appointment-doctor', isAuthenticatedUser, bookAppointmentDoctor);
router.post('/book-appointment-lab', isAuthenticatedUser, bookLabAppointment);

export default router;