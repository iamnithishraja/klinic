import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import orderService from '../services/orderService';

// Create Order (Patient/User)
const createOrder = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { products, prescription, totalPrice, needAssignment, laboratoryUser } = req.body;
        const userId = req.user._id;

        console.log('Creating order with data:', {
            userId: userId.toString(),
            products,
            prescription,
            totalPrice,
            needAssignment,
            laboratoryUser
        });

        const order = await orderService.createOrder({
            orderedBy: userId.toString(),
            laboratoryUser: laboratoryUser || undefined,
            products: products || undefined,
            prescription: prescription ? prescription.trim() : undefined,
            totalPrice: totalPrice ? Number(totalPrice) : undefined,
            needAssignment: needAssignment || false
        });

        res.status(201).json({
            success: true,
            data: order,
            message: 'Order created successfully'
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get User Orders (Patient)
const getMyOrders = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 10 } = req.query;

        console.log('Getting user orders for:', userId.toString(), 'with filters:', { status, page, limit });

        const filters = {
            status: status ? String(status) : undefined
        };

        const pagination = {
            page: Math.max(1, Number(page)),
            limit: Math.min(100, Math.max(1, Number(limit)))
        };

        const result = await orderService.getOrdersByUser(userId.toString(), filters, pagination);

        console.log(`Found ${result.orders.length} orders for user`);

        res.status(200).json({
            success: true,
            data: {
                orders: result.orders,
                pagination: result.pagination
            }
        });
    } catch (error: any) {
        console.error('Get my orders error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get Lab Orders (Lab User)
const getLabOrders = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 10, assignedOnly, unassignedOnly } = req.query;

        console.log('Getting lab orders for user:', userId.toString());
        console.log('Query parameters:', { status, page, limit, assignedOnly, unassignedOnly });

        const filters = {
            status: status ? String(status) : undefined,
            assignedOnly: assignedOnly === 'true',
            unassignedOnly: unassignedOnly === 'true',
        };

        const pagination = {
            page: Math.max(1, Number(page)),
            limit: Math.min(100, Math.max(1, Number(limit)))
        };

        console.log('Final filters:', filters);
        console.log('Pagination:', pagination);

        const result = await orderService.getOrdersByLab(userId.toString(), filters as any, pagination);

        console.log(`Found ${result.orders.length} lab orders`);
        console.log('Orders:', result.orders.map(o => ({ id: o._id, status: o.status, needAssignment: o.needAssignment, laboratoryUser: o.laboratoryUser })));

        res.status(200).json({
            success: true,
            data: {
                orders: result.orders,
                pagination: result.pagination
            }
        });
    } catch (error: any) {
        console.error('Get lab orders error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Update Order Status (Public access)
const updateOrderStatus = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        console.log('Updating order status:', { orderId, status });

        const validStatuses = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
            return;
        }

        const updatedOrder = await orderService.updateOrderStatus(orderId, status);

        if (!updatedOrder) {
            res.status(404).json({
                success: false,
                error: 'Order not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: updatedOrder,
            message: 'Order status updated successfully'
        });
    } catch (error: any) {
        console.error('Update order status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get Order Details (Public access)
const getOrderDetails = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        console.log('Getting order details for:', orderId);

        const order = await orderService.getOrderById(orderId);

        if (!order) {
            res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error: any) {
        console.error('Get order details error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get Order by ID (Public access)
const getOrderById = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        
        if (!orderId || orderId.length !== 24) {
            res.status(400).json({
                success: false,
                error: 'Invalid order ID format'
            });
            return;
        }

        console.log('Getting order by ID:', orderId);

        const order = await orderService.getOrderById(orderId);
        
        if (!order) {
            res.status(404).json({
                success: false,
                error: 'Order not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error: any) {
        console.error('Get order by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Claim Order for Laboratory (Lab User)
const claimOrder = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        console.log('Claiming order:', { orderId, userId: userId.toString() });

        const existingOrder = await orderService.getOrderById(orderId);
        if (!existingOrder) {
            res.status(404).json({
                success: false,
                error: 'Order not found'
            });
            return;
        }

        if (!existingOrder.needAssignment) {
            res.status(400).json({
                success: false,
                error: 'Order does not need assignment or has already been assigned'
            });
            return;
        }

        const updatedOrder = await orderService.assignLabToOrder(orderId, userId.toString());

        res.status(200).json({
            success: true,
            data: updatedOrder,
            message: 'Order claimed successfully'
        });
    } catch (error: any) {
        console.error('Claim order error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

export {
    createOrder,
    getMyOrders,
    getLabOrders,
    updateOrderStatus,
    getOrderDetails,
    getOrderById,
    claimOrder
};