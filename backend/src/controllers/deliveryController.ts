import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import orderService from '../services/orderService';
import { DeliveryBoyProfile } from '../models/profileModel';
import User from '../models/userModel';

// Get orders assigned to delivery partner
const getDeliveryOrders = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 10, date, startDate } = req.query;

        console.log('Getting delivery orders for user:', userId.toString(), 'with filters:', { status, date, startDate });

        const filters: any = {
            status: status ? String(status) : undefined
        };

        // Handle date filtering
        if (date) {
            // Specific date filter (YYYY-MM-DD format)
            const targetDate = new Date(String(date));
            const nextDate = new Date(targetDate);
            nextDate.setDate(nextDate.getDate() + 1);
            
            filters.createdAt = {
                $gte: targetDate.toISOString(),
                $lt: nextDate.toISOString()
            };
        } else if (startDate) {
            // Date range filter from startDate to now
            const startDateObj = new Date(String(startDate));
            filters.createdAt = {
                $gte: startDateObj.toISOString()
            };
        }

        const pagination = {
            page: Math.max(1, Number(page)),
            limit: Math.min(100, Math.max(1, Number(limit)))
        };

        // Get orders assigned to this delivery partner
        const result = await orderService.getOrdersByDeliveryPartner(userId.toString(), filters, pagination);

        console.log(`Found ${result.orders.length} delivery orders with date filters`);

        res.status(200).json({
            success: true,
            data: {
                orders: result.orders,
                pagination: result.pagination
            }
        });
    } catch (error: any) {
        console.error('Get delivery orders error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Accept assigned order
const acceptOrder = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        if (!orderId) {
            res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
            return;
        }

        console.log('Accepting order:', { orderId, userId: userId.toString() });

        const existingOrder = await orderService.getOrderById(orderId);
        if (!existingOrder) {
            res.status(404).json({
                success: false,
                error: 'Order not found'
            });
            return;
        }

        console.log('Order found:', {
            id: existingOrder._id,
            status: existingOrder.status,
            needAssignment: existingOrder.needAssignment,
            laboratoryUser: existingOrder.laboratoryUser,
            deliveryPartner: existingOrder.deliveryPartner,
            currentUserId: userId.toString()
        });

        // Check if the order is assigned to the current delivery partner
        const orderDeliveryPartnerId = existingOrder.deliveryPartner?._id?.toString() || existingOrder.deliveryPartner?.toString();
        if (orderDeliveryPartnerId !== userId.toString()) {
            console.log('Delivery partner mismatch:', {
                orderDeliveryPartner: orderDeliveryPartnerId,
                currentUserId: userId.toString(),
                match: orderDeliveryPartnerId === userId.toString()
            });
            res.status(403).json({
                success: false,
                error: 'Order not assigned to you'
            });
            return;
        }

        if (existingOrder.status !== 'assigned_to_delivery') {
            res.status(400).json({
                success: false,
                error: 'Order is not in assigned status'
            });
            return;
        }

        const updatedOrder = await orderService.acceptDeliveryOrder(orderId);

        res.status(200).json({
            success: true,
            data: updatedOrder,
            message: 'Order accepted successfully'
        });
    } catch (error: any) {
        console.error('Accept order error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Reject assigned order
const rejectOrder = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.user._id;

        if (!orderId) {
            res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
            return;
        }

        console.log('Rejecting order:', { orderId, userId: userId.toString(), reason });

        if (!reason || reason.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: 'Rejection reason is required'
            });
            return;
        }

        const existingOrder = await orderService.getOrderById(orderId);
        if (!existingOrder) {
            res.status(404).json({
                success: false,
                error: 'Order not found'
            });
            return;
        }

        // Check if the order is assigned to the current delivery partner
        const orderDeliveryPartnerId = existingOrder.deliveryPartner?._id?.toString() || existingOrder.deliveryPartner?.toString();
        if (orderDeliveryPartnerId !== userId.toString()) {
            res.status(403).json({
                success: false,
                error: 'Order not assigned to you'
            });
            return;
        }

        if (existingOrder.status !== 'assigned_to_delivery') {
            res.status(400).json({
                success: false,
                error: 'Order is not in assigned status'
            });
            return;
        }

        const updatedOrder = await orderService.rejectDeliveryOrder(orderId, reason);

        res.status(200).json({
            success: true,
            data: updatedOrder,
            message: 'Order rejected successfully'
        });
    } catch (error: any) {
        console.error('Reject order error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Update delivery status
const updateDeliveryStatus = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        if (!orderId) {
            res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
            return;
        }

        console.log('Updating delivery status:', { orderId, userId: userId.toString(), status });

        const validStatuses = ['out_for_delivery', 'delivered'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
            return;
        }

        const existingOrder = await orderService.getOrderById(orderId);
        if (!existingOrder) {
            res.status(404).json({
                success: false,
                error: 'Order not found'
            });
            return;
        }

        // Check if the order is assigned to the current delivery partner
        const orderDeliveryPartnerId = existingOrder.deliveryPartner?._id?.toString() || existingOrder.deliveryPartner?.toString();
        if (orderDeliveryPartnerId !== userId.toString()) {
            res.status(403).json({
                success: false,
                error: 'Order not assigned to you'
            });
            return;
        }

        if (existingOrder.status !== 'delivery_accepted' && status === 'out_for_delivery') {
            res.status(400).json({
                success: false,
                error: 'Order must be in delivery_accepted status to mark as out for delivery'
            });
            return;
        }

        if (existingOrder.status !== 'out_for_delivery' && status === 'delivered') {
            res.status(400).json({
                success: false,
                error: 'Order must be in out_for_delivery status to mark as delivered'
            });
            return;
        }

        const updatedOrder = await orderService.updateDeliveryStatus(orderId, status);

        res.status(200).json({
            success: true,
            data: updatedOrder,
            message: 'Delivery status updated successfully'
        });
    } catch (error: any) {
        console.error('Update delivery status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get delivery partner profile
const getDeliveryProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;

        console.log('Getting delivery profile for user:', userId.toString());

        const profile = await DeliveryBoyProfile.findOne({ user: userId }).populate('user', 'name email phone');
        
        if (!profile) {
            res.status(404).json({
                success: false,
                error: 'Delivery profile not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error: any) {
        console.error('Get delivery profile error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get delivery partner statistics
const getDeliveryStats = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;

        console.log('Getting delivery stats for user:', userId.toString());

        const stats = await orderService.getDeliveryPartnerStats(userId.toString());

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('Get delivery stats error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};



export {
    getDeliveryOrders,
    acceptOrder,
    rejectOrder,
    updateDeliveryStatus,
    getDeliveryProfile,
    getDeliveryStats
}; 