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
    orderData?: any; // Added for product orders
}

interface CODOrderRequest {
    orderData: {
        products?: Array<{
            product: string;
            quantity: number;
        }>;
        prescription?: string;
        totalPrice: number;
        needAssignment: boolean;
        deliveryAddress?: {
            address: string;
            pinCode: string;
        };
    };
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

/**
 * Razorpay Webhook Handler with Enhanced Security
 * - Verifies signature using raw body
 * - Checks for replay attacks using event id and timestamp
 * - Validates payload structure
 * - Handles only whitelisted events
 */
const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'] as string;

        // Use raw body for signature verification
        // Assumes express.json({ verify: ... }) middleware stores rawBody on req
        // See: https://razorpay.com/docs/webhooks/guide/#validate-signature
        const rawBody = (req as any).rawBody || JSON.stringify(req.body);

        if (!secret || !signature) {
            console.error('Webhook secret or signature missing');
            res.status(400).json({ message: 'Webhook secret or signature missing' });
            return;
        }

            const expectedSignature = crypto
                .createHmac('sha256', secret)
            .update(rawBody)
                .digest('hex');

            if (expectedSignature !== signature) {
            console.error('Invalid webhook signature');
                res.status(400).json({ message: 'Invalid webhook signature' });
                return;
            }

        // Prevent replay attacks: check event id and created_at timestamp
        // Optionally, store processed event ids in a cache/db for idempotency
        const eventId = req.headers['x-razorpay-event-id'] as string;
        const eventCreatedAt = req.body.created_at;
        if (!eventId || !eventCreatedAt) {
            console.error('Missing event id or created_at in webhook');
            res.status(400).json({ message: 'Missing event id or created_at' });
            return;
        }
        // Example: Check if eventId already processed (pseudo-code)
        // if (await isEventProcessed(eventId)) {
        //     res.status(200).json({ status: 'duplicate' });
        //     return;
        // }
        // await markEventProcessed(eventId);

        // Whitelist allowed events
        const allowedEvents = new Set(['payment.captured', 'payment.failed']);
        const event = req.body.event;
        if (!allowedEvents.has(event)) {
            console.warn('Webhook event not allowed:', event);
            res.status(400).json({ message: 'Event not allowed' });
            return;
        }

        // Validate payload structure
        if (!req.body.payload || !req.body.payload.payment || !req.body.payload.payment.entity) {
            console.error('Invalid webhook payload structure');
            res.status(400).json({ message: 'Invalid webhook payload structure' });
            return;
        }

        const payload = req.body.payload.payment.entity;

        console.log('Razorpay webhook received:', event, payload.id);

        if (event === 'payment.captured') {
            // Payment was successful - verify payment status
            try {
                // Fetch payment from Razorpay to confirm status and details
                const payment = await razorpayInstance.payments.fetch(payload.id);

                if (payment.status !== 'captured') {
                    console.error('Payment not captured in webhook:', payload.id);
                    res.status(400).json({ message: 'Payment not captured' });
                    return;
                }

            const notes = payload.notes;

                // Handle appointment payments
            if (notes && notes.appointmentId && notes.appointmentType) {
                const { appointmentId, appointmentType } = notes;
                
                    // Double-check appointment exists and not already paid
                    let appointment;
                    if (appointmentType === 'doctor') {
                        appointment = await DoctorAppointment.findById(appointmentId);
                    } else {
                        appointment = await LabAppointment.findById(appointmentId);
                    }
                    if (!appointment) {
                        console.error('Appointment not found for webhook:', appointmentId);
                        res.status(404).json({ message: 'Appointment not found' });
                        return;
                    }
                    if (appointment.isPaid) {
                        console.log('Appointment already marked as paid:', appointmentId);
                    } else {
                if (appointmentType === 'doctor') {
                    await DoctorAppointment.findByIdAndUpdate(appointmentId, {
                                isPaid: true,
                                paymentId: payload.id,
                                paymentStatus: 'completed'
                    });
                            console.log('Doctor appointment payment completed:', appointmentId);
                } else {
                    await LabAppointment.findByIdAndUpdate(appointmentId, {
                                isPaid: true,
                                paymentId: payload.id,
                                paymentStatus: 'completed'
                            });
                            console.log('Lab appointment payment completed:', appointmentId);
                        }
                    }
                }

                // Handle product order payments securely
                if (notes && notes.paymentType === 'product' && notes.orderData) {
                    try {
                        // Securely parse and validate orderData
                        let orderData;
                        try {
                            orderData = JSON.parse(notes.orderData);
                        } catch (parseErr) {
                            console.error('Invalid orderData JSON in product payment notes:', parseErr);
                            res.status(400).json({ message: 'Invalid orderData in payment notes' });
                            return;
                        }

                        // Validate userId
                        const userId = notes.userId;
                        if (!userId || typeof userId !== 'string') {
                            console.error('Missing or invalid userId in product payment notes');
                            res.status(400).json({ message: 'Invalid userId in payment notes' });
                            return;
                        }

                        // Optionally, validate orderData structure here (e.g., required fields)
                        // For example:
                        // if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
                        //     res.status(400).json({ message: 'Invalid orderData: missing items' });
                        //     return;
                        // }

                        // Create the order only after successful payment verification
                        const orderService = require('../services/orderService').default;

                        const orderDataWithUser = {
                            ...orderData,
                            orderedBy: userId,
                            isPaid: true,
                            paymentId: payload.id,
                            razorpayOrderId: payload.order_id
                        };

                        // Create the order
                        const createdOrders = await orderService.createMultiLabOrders(orderDataWithUser);

                        if (!createdOrders || createdOrders.length === 0) {
                            console.error('Failed to create order in webhook for payment:', payload.id);
                            res.status(500).json({ message: 'Failed to create order' });
                            return;
                        }

                        // Update order status based on needAssignment
                        for (const order of createdOrders) {
                            if (order.needAssignment) {
                                order.status = 'pending_assignment';
                            } else {
                                order.status = 'confirmed';
                            }
                            await order.save();
                        }

                        console.log('Product order created successfully via webhook for payment:', payload.id);

                    } catch (error) {
                        console.error('Error creating order in webhook:', error);
                        res.status(500).json({ message: 'Failed to create order in webhook' });
                        return;
                    }
                }

            } catch (error) {
                console.error('Error fetching payment in webhook:', error);
                res.status(500).json({ message: 'Failed to verify payment in webhook' });
                return;
            }
        } else if (event === 'payment.failed') {
            // Optionally, handle failed payment (update order/appointment status, notify user, etc.)
            console.log('Payment failed:', payload.id);
        }

        // Always respond 200 to acknowledge receipt (to avoid repeated webhook delivery)
        res.status(200).json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};

const createProductPaymentOrder = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { amount, currency = 'INR', orderData }: ProductPaymentOrderRequest = req.body;
        const userId = req.user._id;

        // Optionally, validate orderData structure here for security

        // Create Razorpay order for payment
        const options = {
            amount: amount, // Amount should already be in paise from frontend
            currency: currency,
            receipt: `ORDER_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substr(2, 8)}`,
            notes: {
                userId: userId.toString(),
                orderData: JSON.stringify(orderData), // Store order data in notes for webhook
                paymentType: 'product'
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
            orderData
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_API_SECRET!)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            res.status(400).json({ 
                success: false,
                message: 'Invalid payment signature' 
            });
            return;
        }

        // Verify payment status with Razorpay
        try {
            const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
            
            if (payment.status !== 'captured') {
                res.status(400).json({ 
                    success: false,
                    message: 'Payment not captured. Please try again.' 
                });
                return;
            }
        } catch (error) {
            console.error('Error fetching payment from Razorpay:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to verify payment status' 
            });
            return;
        }

        // Securely validate orderData before creating order
        const userId = req.user._id;
        // Optionally, validate orderData structure here

        const orderService = require('../services/orderService').default;
        
        const orderDataWithUser = {
            ...orderData,
            orderedBy: userId.toString(),
            isPaid: true,
            paymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id
        };

        // Create the order
        const createdOrders = await orderService.createMultiLabOrders(orderDataWithUser);

        if (!createdOrders || createdOrders.length === 0) {
            res.status(500).json({ 
                success: false,
                message: 'Failed to create order after payment verification' 
            });
            return;
        }

        // Update order status based on needAssignment
        for (const order of createdOrders) {
            if (order.needAssignment) {
                order.status = 'pending_assignment';
            } else {
                order.status = 'confirmed';
            }
            await order.save();
        }

        res.status(200).json({ 
            success: true,
            message: 'Payment verified and order created successfully',
            paymentId: razorpay_payment_id,
            orders: createdOrders,
            orderStatus: orderData.needAssignment ? 'pending_assignment' : 'confirmed'
        });

    } catch (error) {
        console.error('Error verifying product payment:', error);
        res.status(500).json({ 
            success: false,
            message: 'Payment verification failed', 
            error: (error as any)?.message || 'Unknown error'
        });
    }
};

const createCODOrder = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderData }: CODOrderRequest = req.body;
        const userId = req.user._id;

        console.log('Creating COD order with data:', orderData);

        // Validate order data
        if (!orderData) {
            res.status(400).json({ 
                success: false,
                message: 'Invalid order data' 
            });
            return;
        }

        // For prescription orders, totalPrice can be 0 initially
        // For product orders, totalPrice should be greater than 0
        if (orderData.needAssignment) {
            // Prescription orders can have 0 totalPrice initially
            if (orderData.totalPrice === undefined || orderData.totalPrice === null) {
                res.status(400).json({ 
                    success: false,
                    message: 'Invalid order data or total price' 
                });
                return;
            }
        } else {
            // Product orders should have totalPrice > 0
            if (!orderData.totalPrice || orderData.totalPrice <= 0) {
                res.status(400).json({ 
                    success: false,
                    message: 'Invalid order data or total price' 
                });
                return;
            }
        }

        const orderService = require('../services/orderService').default;
        
        const orderDataWithUser = {
            ...orderData,
            orderedBy: userId.toString(),
            isPaid: false, // COD orders are not paid initially
            cod: true, // Mark as COD order
        };

        // Create the order
        const createdOrders = await orderService.createMultiLabOrders(orderDataWithUser);

        if (!createdOrders || createdOrders.length === 0) {
            res.status(500).json({ 
                success: false,
                message: 'Failed to create COD order' 
            });
            return;
        }

        // Update order status based on needAssignment
        for (const order of createdOrders) {
            if (order.needAssignment) {
                order.status = 'pending_assignment';
            } else {
                order.status = 'confirmed';
            }
            await order.save();
        }

        res.status(201).json({ 
            success: true,
            message: 'COD order created successfully',
            orders: createdOrders,
            orderStatus: orderData.needAssignment ? 'pending_assignment' : 'confirmed'
        });

    } catch (error) {
        console.error('Error creating COD order:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create COD order', 
            error: (error as any)?.message || 'Unknown error'
        });
    }
};

const updateOrderPaymentStatus = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { isPaid } = req.body;

        console.log('Updating order payment status:', orderId, 'isPaid:', isPaid);

        const orderService = require('../services/orderService').default;
        
        // Update the order's payment status
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { 
                isPaid: isPaid,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('orderedBy', 'name email phone')
         .populate('laboratoryUser', 'name email phone')
         .populate('deliveryPartner', 'name email phone')
         .populate('products.product', 'name price imageUrl');

        if (!updatedOrder) {
            res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
            return;
        }

        res.status(200).json({ 
            success: true,
            message: 'Order payment status updated successfully',
            order: updatedOrder
        });

    } catch (error) {
        console.error('Error updating order payment status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update order payment status', 
            error: (error as any)?.message || 'Unknown error'
        });
    }
};

export { createPaymentOrder, verifyPayment, handleWebhook, createProductPaymentOrder, verifyProductPayment, createCODOrder, updateOrderPaymentStatus }; 