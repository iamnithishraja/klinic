import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import orderService from '../services/orderService';
import Order from '../models/ordersModel';

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

        // Create order without validation - always use multi-lab approach
        const orders = await orderService.createMultiLabOrders({
            orderedBy: userId.toString(),
            laboratoryUser: laboratoryUser || undefined,
            products: products || undefined,
            prescription: prescription ? prescription.trim() : undefined,
            totalPrice: totalPrice ? Number(totalPrice) : undefined,
            needAssignment: needAssignment || false
        });

        res.status(201).json({
            success: true,
            data: orders,
            message: `Orders created successfully for ${orders.length} laboratories`
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Create COD Order (Cash on Delivery)
const createCODOrder = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderData } = req.body;
        const userId = req.user._id;

        console.log('Creating COD order with data:', {
            userId: userId.toString(),
            orderData
        });

        // Validate order data
        if (!orderData) {
            res.status(400).json({ 
                success: false, 
                error: 'Order data is required' 
            });
            return;
        }

        // Create COD order with cod flag set to true
        const orders = await orderService.createMultiLabOrders({
            orderedBy: userId.toString(),
            laboratoryUser: orderData.laboratoryUser || undefined,
            products: orderData.products || undefined,
            prescription: orderData.prescription ? orderData.prescription.trim() : undefined,
            totalPrice: orderData.totalPrice ? Number(orderData.totalPrice) : undefined,
            needAssignment: orderData.needAssignment || false,
            cod: true, // Set COD flag
            isPaid: false, // COD orders are not paid initially
            deliveryAddress: orderData.deliveryAddress || undefined
        });

        res.status(201).json({
            success: true,
            data: orders,
            message: `COD orders created successfully for ${orders.length} laboratories`
        });
    } catch (error: any) {
        console.error('Create COD order error:', error);
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

// Update order status (public access)
const updateOrderStatus = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!orderId) {
            res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
            return;
        }

        console.log('Updating order status:', { orderId, status });

        const updatedOrder = await orderService.updateOrderStatusWithValidation(orderId, status, req.user._id.toString());

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

// Get order details (public access)
const getOrderDetails = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
            return;
        }

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

// Claim order for laboratory (Lab User)
const claimOrder = async (req: CustomRequest, res: Response): Promise<void> => {
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

        console.log('Claiming order:', { orderId, userId: userId.toString() });

        const existingOrder = await orderService.getOrderById(orderId);
        if (!existingOrder) {
            res.status(404).json({
                success: false,
                error: 'Order not found'
            });
            return;
        }

        if (existingOrder.laboratoryUser) {
            res.status(400).json({
                success: false,
                error: 'Order is already assigned to a laboratory'
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

// Assign delivery partner to order (Lab User)
const assignDeliveryPartner = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { deliveryPartnerId } = req.body;
        const userId = req.user._id;

        console.log('=== ASSIGN DELIVERY PARTNER DEBUG ===');
        console.log('Request user:', {
            id: req.user._id,
            role: req.user.role,
            email: req.user.email
        });
        console.log('Request params:', { orderId, deliveryPartnerId });

        if (!orderId || !deliveryPartnerId) {
            res.status(400).json({
                success: false,
                error: 'Order ID and delivery partner ID are required'
            });
            return;
        }

        console.log('Assigning delivery partner to order:', { orderId, deliveryPartnerId, userId: userId.toString() });

        const existingOrder = await orderService.getOrderById(orderId);
        if (!existingOrder) {
            res.status(404).json({
                success: false,
                error: 'Order not found'
            });
            return;
        }

        console.log('Order found:', {
            orderId: existingOrder._id,
            status: existingOrder.status,
            laboratoryUser: existingOrder.laboratoryUser,
            laboratoryUserType: typeof existingOrder.laboratoryUser,
            needAssignment: existingOrder.needAssignment
        });

        console.log('Order lab assignment check:', {
            orderLabId: existingOrder.laboratoryUser?.toString(),
            currentUserId: userId.toString(),
            orderLabIdType: typeof existingOrder.laboratoryUser,
            currentUserIdType: typeof userId,
            match: existingOrder.laboratoryUser?.toString() === userId.toString()
        });

        // Handle both ObjectId and string comparisons
        const orderLabId = existingOrder.laboratoryUser?._id?.toString() || existingOrder.laboratoryUser?.toString();
        const currentUserId = userId.toString();
        
        console.log('Detailed lab assignment check:', {
            orderLabId,
            currentUserId,
            orderLabIdType: typeof orderLabId,
            currentUserIdType: typeof currentUserId,
            orderLabUserObject: existingOrder.laboratoryUser,
            orderLabUserId: existingOrder.laboratoryUser?._id,
            orderLabUserString: existingOrder.laboratoryUser?.toString()
        });
        
        // Check if order has laboratory assignment
        if (!existingOrder.laboratoryUser) {
            console.log('Order has no laboratory assignment');
            res.status(403).json({
                success: false,
                error: 'Order not assigned to any laboratory'
            });
            return;
        }
        
        // For populated objects, compare the _id field
        const isAssignedToCurrentLab = existingOrder.laboratoryUser._id?.toString() === currentUserId;
        
        if (!isAssignedToCurrentLab) {
            console.log('Lab assignment mismatch:', {
                orderLabId: existingOrder.laboratoryUser._id?.toString(),
                currentUserId,
                orderLabIdType: typeof existingOrder.laboratoryUser._id,
                currentUserIdType: typeof currentUserId
            });
            res.status(403).json({
                success: false,
                error: 'Order not assigned to your laboratory'
            });
            return;
        }

        if (existingOrder.status !== 'confirmed' && existingOrder.status !== 'pending') {
            res.status(400).json({
                success: false,
                error: 'Order must be in confirmed or pending status to assign delivery partner'
            });
            return;
        }

        console.log('Authorization passed, proceeding with assignment...');

        const updatedOrder = await orderService.assignOrderToDeliveryPartner(orderId, deliveryPartnerId);

        console.log('Assignment successful:', {
            orderId: updatedOrder?._id,
            deliveryPartner: updatedOrder?.deliveryPartner,
            status: updatedOrder?.status
        });

        res.status(200).json({
            success: true,
            data: updatedOrder,
            message: 'Delivery partner assigned successfully'
        });
    } catch (error: any) {
        console.error('Assign delivery partner error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get available delivery partners (Lab User)
const getAvailableDeliveryPartners = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        console.log('Getting available delivery partners');
        console.log('User making request:', {
            userId: req.user._id,
            userRole: req.user.role,
            userEmail: req.user.email
        });

        const deliveryPartners = await orderService.getAvailableDeliveryPartners();

        console.log(`Returning ${deliveryPartners.length} delivery partners to lab user`);

        res.status(200).json({
            success: true,
            data: deliveryPartners
        });
    } catch (error: any) {
        console.error('Get available delivery partners error:', error);
        console.error('Error details:', {
            message: error?.message || 'Unknown error',
            stack: error?.stack || 'No stack trace'
        });
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get lab orders with customer addresses
const getLabOrdersWithAddresses = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 10, assignedOnly, unassignedOnly } = req.query;

        console.log('Getting lab orders with addresses for user:', userId.toString());

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

        let result;
        try {
            result = await orderService.getOrdersByLab(userId.toString(), filters as any, pagination);
            console.log(`Retrieved ${result.orders.length} orders from service`);
        } catch (serviceError) {
            console.error('Error calling orderService.getOrdersByLab:', serviceError);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to retrieve orders' 
            });
            return;
        }

        // Import UserProfile at the top level to avoid dynamic import issues
        let UserProfile;
        try {
            const profileModule = await import('../models/profileModel');
            UserProfile = profileModule.UserProfile;
        } catch (importError) {
            console.error('Error importing UserProfile model:', importError);
            // Continue without address population
            const ordersWithAddresses = result.orders.map(order => ({
                ...order.toObject(),
                customerAddress: 'Address not available'
            }));
            
            console.log(`Found ${ordersWithAddresses.length} lab orders without addresses`);
            
            res.status(200).json({
                success: true,
                data: {
                    orders: ordersWithAddresses,
                    pagination: result.pagination
                }
            });
            return;
        }
        
        // Populate customer addresses from user profiles
        const ordersWithAddresses = await Promise.all(
            result.orders.map(async (order) => {
                try {
                    // Convert ObjectId to string if needed
                    const userId = typeof order.orderedBy === 'object' && order.orderedBy._id 
                        ? order.orderedBy._id.toString() 
                        : order.orderedBy.toString();
                    
                    const userProfile = await UserProfile.findOne({ user: userId }).select('address city');
                    
                    const orderObj = order.toObject ? order.toObject() : order;
                    
                    return {
                        ...orderObj,
                        customerAddress: userProfile?.address?.address || userProfile?.city || 'Address not available'
                    };
                } catch (error) {
                    console.error('Error fetching user profile for order:', order._id, error);
                    const orderObj = order.toObject ? order.toObject() : order;
                    return {
                        ...orderObj,
                        customerAddress: 'Address not available'
                    };
                }
            })
        );

        console.log(`Found ${ordersWithAddresses.length} lab orders with addresses`);

        res.status(200).json({
            success: true,
            data: {
                orders: ordersWithAddresses,
                pagination: result.pagination
            }
        });
    } catch (error: any) {
        console.error('Get lab orders with addresses error:', error);
        console.error('Error details:', {
            message: error?.message || 'Unknown error',
            stack: error?.stack || 'No stack trace',
            name: error?.name || 'Unknown error type'
        });
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Cancel unpaid order (when user doesn't complete payment)
const cancelUnpaidOrder = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        console.log('Cancelling unpaid order:', orderId, 'for user:', userId.toString());

        // Find the order and verify ownership
        const order = await Order.findOne({ 
            _id: orderId, 
            orderedBy: userId,
            isPaid: false // Only allow cancellation of unpaid orders
        });

        if (!order) {
            res.status(404).json({ 
                success: false, 
                message: 'Order not found or cannot be cancelled' 
            });
            return;
        }

        // Update order status to cancelled
        order.status = 'cancelled';
        await order.save();

        console.log('Order cancelled successfully:', orderId);

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error: any) {
        console.error('Cancel unpaid order error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get order payment status
const getOrderPaymentStatus = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        console.log('Getting payment status for order:', orderId, 'user:', userId.toString());

        const order = await Order.findOne({ 
            _id: orderId, 
            orderedBy: userId 
        }).select('_id isPaid status needAssignment totalPrice createdAt');

        if (!order) {
            res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                isPaid: order.isPaid,
                status: order.status,
                needAssignment: order.needAssignment,
                totalPrice: order.totalPrice,
                createdAt: order.createdAt
            }
        });
    } catch (error: any) {
        console.error('Get order payment status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Update order payment status (for admin or system use)
const updateOrderPaymentStatus = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { isPaid, status } = req.body;
        const userId = req.user._id;

        console.log('Updating payment status for order:', orderId, 'user:', userId.toString(), { isPaid, status });

        const order = await Order.findOne({ 
            _id: orderId, 
            orderedBy: userId 
        });

        if (!order) {
            res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
            return;
        }

        // Update payment status
        order.isPaid = isPaid;
        
        // Update status if provided
        if (status) {
            order.status = status;
        }

        await order.save();

        console.log('Order payment status updated successfully:', orderId);

        res.status(200).json({
            success: true,
            message: 'Order payment status updated successfully',
            data: {
                orderId: order._id,
                isPaid: order.isPaid,
                status: order.status
            }
        });
    } catch (error: any) {
        console.error('Update order payment status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get user's unpaid orders
const getUnpaidOrders = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        console.log('Getting unpaid orders for user:', userId.toString());

        const pagination = {
            page: Math.max(1, Number(page)),
            limit: Math.min(100, Math.max(1, Number(limit)))
        };

        // Find unpaid orders
        const unpaidOrders = await Order.find({ 
            orderedBy: userId,
            isPaid: false,
            status: { $ne: 'cancelled' } // Exclude cancelled orders
        })
        .sort({ createdAt: -1 })
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .populate('products.product', 'name price imageUrl')
        .lean();

        const totalCount = await Order.countDocuments({ 
            orderedBy: userId,
            isPaid: false,
            status: { $ne: 'cancelled' }
        });

        const totalPages = Math.ceil(totalCount / pagination.limit);

        console.log(`Found ${unpaidOrders.length} unpaid orders for user`);

        res.status(200).json({
            success: true,
            data: {
                orders: unpaidOrders,
                pagination: {
                    currentPage: pagination.page,
                    totalPages,
                    totalCount,
                    hasNextPage: pagination.page < totalPages,
                    hasPrevPage: pagination.page > 1
                }
            }
        });
    } catch (error: any) {
        console.error('Get unpaid orders error:', error);
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
    claimOrder,
    assignDeliveryPartner,
    getAvailableDeliveryPartners,
    getLabOrdersWithAddresses,
    cancelUnpaidOrder,
    getOrderPaymentStatus,
    updateOrderPaymentStatus,
    getUnpaidOrders,
    createCODOrder
};