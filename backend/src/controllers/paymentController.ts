import type { Request, Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import { razorpayInstance } from "../index";
import crypto from "crypto";
import DoctorAppointment from "../models/doctorAppointments";
import LabAppointment from "../models/labAppointments";
import Order from "../models/ordersModel";
import { DoctorProfile, LaboratoryProfile } from "../models/profileModel";

interface PaymentOrderRequest {
    appointmentId: string;
    appointmentType: 'doctor' | 'lab';
    amount: number;
}

interface ProductPaymentOrderRequest {
    amount: number;
    currency?: string;
}

const createPaymentOrder = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId, appointmentType, amount }: PaymentOrderRequest = req.body;
        const userId = req.user._id;

        // Verify appointment belongs to user
        let appointment;
        if (appointmentType === 'doctor') {
            appointment = await DoctorAppointment.findOne({ _id: appointmentId, patient: userId });
        } else {
            appointment = await LabAppointment.findOne({ _id: appointmentId, patient: userId });
        }

        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `${appointmentType === 'doctor' ? 'DR' : 'LAB'}_${appointmentId.slice(-8)}_${Date.now().toString().slice(-8)}`, // Max 40 chars
            notes: {
                appointmentId,
                appointmentType,
                userId: userId.toString()
            }
        };

        const order = await razorpayInstance.orders.create(options);

        res.status(201).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            appointmentId,
            appointmentType
        });

    } catch (error) {
        console.error('Error creating payment order:', error);
        res.status(500).json({ message: 'Failed to create payment order', error });
    }
};

const verifyPayment = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            appointmentId,
            appointmentType
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_API_SECRET!)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            res.status(400).json({ message: 'Invalid payment signature' });
            return;
        }

        // Update appointment payment status
        if (appointmentType === 'doctor') {
            await DoctorAppointment.findByIdAndUpdate(appointmentId, {
                isPaid: true
            });
        } else {
            await LabAppointment.findByIdAndUpdate(appointmentId, {
                isPaid: true
            });
        }

        res.status(200).json({ 
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Payment verification failed', error });
    }
};

const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const body = JSON.stringify(req.body);
        const signature = req.headers['x-razorpay-signature'] as string;

        if (secret) {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(body)
                .digest('hex');

            if (expectedSignature !== signature) {
                res.status(400).json({ message: 'Invalid webhook signature' });
                return;
            }
        }

        const event = req.body.event;
        const payload = req.body.payload.payment.entity;

        console.log('Razorpay webhook received:', event, payload.id);

        if (event === 'payment.captured') {
            // Payment was successful
            const notes = payload.notes;
            
            // Handle appointment payments
            if (notes && notes.appointmentId && notes.appointmentType) {
                const { appointmentId, appointmentType } = notes;
                
                if (appointmentType === 'doctor') {
                    await DoctorAppointment.findByIdAndUpdate(appointmentId, {
                        isPaid: true
                    });
                } else {
                    await LabAppointment.findByIdAndUpdate(appointmentId, {
                        isPaid: true
                    });
                }
            }
            
            // Handle product order payments
            if (notes && notes.orderId) {
                const { orderId } = notes;
                const order = await Order.findById(orderId);
                
                if (order) {
                    order.isPaid = true;
                    
                    // Update order status based on needAssignment
                    if (order.needAssignment) {
                        order.status = 'pending_assignment';
                    } else {
                        order.status = 'confirmed';
                    }
                    
                    await order.save();
                }
            }
        }

        res.status(200).json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};

const createProductPaymentOrder = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { amount, currency = 'INR' }: ProductPaymentOrderRequest = req.body;
        const userId = req.user._id;

        // Create Razorpay order for payment
        const options = {
            amount: amount, // Amount should already be in paise from frontend
            currency: currency,
            receipt: `ORDER_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substr(2, 8)}`,
            notes: {
                userId: userId.toString()
            }
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        res.status(201).json({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });

    } catch (error) {
        console.error('Error creating product payment order:', error);
        res.status(500).json({ message: 'Failed to create payment order', error });
    }
};

const verifyProductPayment = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            orderId
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_API_SECRET!)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            res.status(400).json({ message: 'Invalid payment signature' });
            return;
        }

        // Update order payment status
        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }

        order.isPaid = true;
        
        // Update order status based on needAssignment
        if (order.needAssignment) {
            // For prescription orders - set to pending_assignment for admin to assign lab
            order.status = 'pending_assignment';
        } else {
            // For cart orders - set to confirmed since lab is already assigned
            order.status = 'confirmed';
        }
        
        await order.save();

        res.status(200).json({ 
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id,
            orderStatus: order.status
        });

    } catch (error) {
        console.error('Error verifying product payment:', error);
        res.status(500).json({ message: 'Payment verification failed', error });
    }
};

export { createPaymentOrder, verifyPayment, handleWebhook, createProductPaymentOrder, verifyProductPayment }; 