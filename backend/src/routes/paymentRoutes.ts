import { Router } from "express";
import { createPaymentOrder, verifyPayment, handleWebhook } from "../controllers/paymentController";
import { isAuthenticatedUser } from "../middlewares/auth";

const router = Router();

router.post('/create-payment-order', isAuthenticatedUser, createPaymentOrder);
router.post('/verify-payment', isAuthenticatedUser, verifyPayment);
router.post('/webhook', handleWebhook); // No auth middleware for webhooks

export default router; 