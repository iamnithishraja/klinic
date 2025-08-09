import Order from '../models/ordersModel';
import Product from '../models/productModel';
import productService from './productService';
import mongoose from 'mongoose';
import User from '../models/userModel';

export interface OrderFilters {
    status?: string;
    needAssignment?: boolean;
    userId?: string;
    labId?: string;
    createdAt?: any; // For date filtering (MongoDB date range queries)
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface OrderData {
    orderedBy: string;
    laboratoryUser?: string;
    products?: Array<{
        product: string;
        quantity: number;
    }>;
    prescription?: string;
    totalPrice?: number;
    needAssignment: boolean;
    isPaid?: boolean;
    cod?: boolean;
    deliveryAddress?: {
        address: string;
        pinCode: string;
    };
}

export interface UpdateOrderData {
    status?: string;
    laboratoryUser?: string;
    needAssignment?: boolean;
}

class OrderService {
    // Create multiple orders by splitting products by laboratory (no validation)
    async createMultiLabOrders(orderData: OrderData) {
        console.log('Creating multi-lab orders with data:', orderData);

        const { products, prescription, needAssignment } = orderData;

        const labGroups = new Map<string, Array<{ product: string; quantity: number }>>();

        // If no products, create a single order without lab assignment
        if (!products || products.length === 0) {
            const singleOrderData = {
                orderedBy: orderData.orderedBy,
                laboratoryUser: orderData.laboratoryUser || undefined,
                products: [],
                prescription: prescription,
                totalPrice: 0,
                needAssignment: needAssignment,
                isPaid: orderData.isPaid !== undefined ? orderData.isPaid : false,
                cod: orderData.cod !== undefined ? orderData.cod : false,
                status: 'confirmed', // Set status to confirmed so it can be assigned to delivery
                customerAddress: orderData.deliveryAddress?.address || null,
                customerPinCode: orderData.deliveryAddress?.pinCode || null
            };

            console.log('Creating single order without products:', JSON.stringify(singleOrderData, null, 2));

            try {
                const order = await Order.create(singleOrderData);
                console.log('Single order created successfully:', order._id);
                const populatedOrder = await this.getOrderById(order._id.toString());
                return [populatedOrder];
            } catch (error: any) {
                console.error('Error creating single order:', error);
                throw new Error(`Failed to create single order: ${error.message}`);
            }
        }

        // Group products by laboratory (user field in product)
        for (const item of products) {
            const product = await productService.getProductById(item.product);
            // No validation, just try to get the labId
            let labId: string | undefined = undefined;
            if (product && product.user) {
                if (typeof product.user === 'string') {
                    labId = product.user;
                } else if (typeof product.user === 'object' && product.user._id) {
                    labId = product.user._id.toString();
                }
            }
            if (labId) {
                if (!labGroups.has(labId)) {
                    labGroups.set(labId, []);
                }
                labGroups.get(labId)!.push(item);
            } else {
                console.log(`Product ${item.product} has no lab assignment, skipping...`);
            }
        }

        console.log('Products grouped by lab:', Object.fromEntries(labGroups));

        // If no labs found, create a single order
        if (labGroups.size === 0) {
            const singleOrderData = {
                orderedBy: orderData.orderedBy,
                laboratoryUser: orderData.laboratoryUser || undefined,
                products: products.map(item => ({
                    product: item.product,
                    quantity: item.quantity
                })),
                prescription: prescription,
                totalPrice: 0,
                needAssignment: needAssignment,
                isPaid: orderData.isPaid !== undefined ? orderData.isPaid : false,
                cod: orderData.cod !== undefined ? orderData.cod : false,
                status: 'confirmed', // Set status to confirmed so it can be assigned to delivery
                customerAddress: orderData.deliveryAddress?.address || null,
                customerPinCode: orderData.deliveryAddress?.pinCode || null
            };

            console.log('Creating single order for products without lab assignment:', JSON.stringify(singleOrderData, null, 2));

            try {
                const order = await Order.create(singleOrderData);
                console.log('Single order created successfully:', order._id);
                const populatedOrder = await this.getOrderById(order._id.toString());
                return [populatedOrder];
            } catch (error: any) {
                console.error('Error creating single order:', error);
                throw new Error(`Failed to create single order: ${error.message}`);
            }
        }

        // Create separate order for each lab
        const createdOrders = [];
        for (const [labId, labProducts] of labGroups) {
            let labTotalPrice = 0;
            for (const item of labProducts) {
                const product = await productService.getProductById(item.product);
                labTotalPrice += (product?.price || 0) * item.quantity;
            }

            const labOrderData = {
                orderedBy: orderData.orderedBy,
                laboratoryUser: labId,
                products: labProducts.map(item => ({
                    product: item.product,
                    quantity: item.quantity
                })),
                prescription: prescription,
                totalPrice: labTotalPrice,
                needAssignment: needAssignment,
                isPaid: orderData.isPaid !== undefined ? orderData.isPaid : false,
                cod: orderData.cod !== undefined ? orderData.cod : false,
                status: 'confirmed', // Set status to confirmed so it can be assigned to delivery
                customerAddress: orderData.deliveryAddress?.address || null,
                customerPinCode: orderData.deliveryAddress?.pinCode || null
            };

            console.log(`Creating order for lab ${labId}:`, JSON.stringify(labOrderData, null, 2));

            let order;
            try {
                order = await Order.create(labOrderData);
                console.log(`Order created successfully for lab ${labId}:`, order._id);
                
                // Verify the order was created with correct lab assignment
                const createdOrder = await Order.findById(order._id).populate('laboratoryUser', 'name email');
                const labName = createdOrder?.laboratoryUser && typeof createdOrder.laboratoryUser === 'object' && 'name' in createdOrder.laboratoryUser
                    ? (createdOrder.laboratoryUser as any).name
                    : 'Not populated';
                console.log('Created order details:', {
                    orderId: createdOrder?._id,
                    labId: createdOrder?.laboratoryUser?._id,
                    labName: labName,
                    status: createdOrder?.status,
                    isPaid: createdOrder?.isPaid,
                    cod: createdOrder?.cod
                });
            } catch (error: any) {
                console.error(`Error creating order for lab ${labId}:`, error);
                console.error('Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                });
                throw new Error(`Failed to create order for lab ${labId}: ${error.message}`);
            }

            for (const item of labProducts) {
                try {
                    await productService.updateProductQuantity(item.product, -item.quantity);
                } catch (error) {
                    console.log('Product quantity update failed, continuing...');
                }
            }

            const populatedOrder = await this.getOrderById(order._id.toString());
            createdOrders.push(populatedOrder);

            console.log(`Order created for lab ${labId}:`, order._id);
        }

        console.log(`Created ${createdOrders.length} orders for ${labGroups.size} labs`);
        return createdOrders;
    }

    // Create a new order (no validation)
    async createOrder(orderData: OrderData) {
        console.log('Creating order with data:', orderData);

        const { products, totalPrice, needAssignment } = orderData;

        let calculatedTotalPrice = totalPrice;
        if (products && products.length > 0 && !totalPrice) {
            calculatedTotalPrice = 0;
            for (const item of products) {
                const product = await productService.getProductById(item.product);
                if (product) {
                    calculatedTotalPrice += product.price * item.quantity;
                }
            }
        }

        const orderDataWithObjectIds = {
            ...orderData,
            orderedBy: orderData.orderedBy,
            laboratoryUser: orderData.laboratoryUser || undefined,
            products: orderData.products || undefined,
            totalPrice: calculatedTotalPrice || 0,
            customerAddress: orderData.deliveryAddress?.address || null,
            customerPinCode: orderData.deliveryAddress?.pinCode || null
        };

        let order;
        try {
            order = await Order.create(orderDataWithObjectIds);
            console.log('Order created successfully:', order._id);
        } catch (error: any) {
            console.error('Error creating order:', error);
            throw new Error(`Failed to create order: ${error.message}`);
        }

        if (products && products.length > 0) {
            for (const item of products) {
                try {
                    await productService.updateProductQuantity(item.product, -item.quantity);
                } catch (error) {
                    console.log('Product quantity update failed, continuing...');
                }
            }
        }

        return await this.getOrderById(order._id.toString());
    }

    // Get all orders with filters and pagination (no validation)
    async getAllOrders(filters: OrderFilters, pagination: PaginationOptions) {
        const { status, needAssignment, userId, labId } = filters;
        const { page, limit } = pagination;

        console.log('Getting all orders with filters:', filters, 'and pagination:', pagination);

        const filter: any = {};

        if (status) {
            filter.status = status;
        }
        if (needAssignment !== undefined) {
            filter.needAssignment = needAssignment;
        }
        if (userId) {
            filter.orderedBy = userId;
        }
        if (labId) {
            filter.laboratoryUser = labId;
        }

        console.log('Final filter:', filter);

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .populate('orderedBy', 'name email phone')
            .populate('laboratoryUser', 'name email phone')
            .populate('deliveryPartner', 'name email phone')
            .populate('products.product', 'name price imageUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        console.log(`Found ${orders.length} orders out of ${total} total`);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }

    // Get orders by user ID (no validation)
    async getOrdersByUser(userId: string, filters: OrderFilters, pagination: PaginationOptions) {
        const { status } = filters;
        const { page, limit } = pagination;

        console.log('Getting orders for user:', userId, 'with filters:', filters);

        const filter: any = { orderedBy: userId };
        if (status) {
            filter.status = status;
        }

        console.log('User orders filter:', filter);

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .populate('orderedBy', 'name email phone')
            .populate('laboratoryUser', 'name email phone')
            .populate('deliveryPartner', 'name email phone')
            .populate('products.product', 'name price imageUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        console.log(`Found ${orders.length} orders for user ${userId}`);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }

    // Get orders by laboratory user ID (no validation)
    async getOrdersByLab(labId: string, filters: OrderFilters & { assignedOnly?: boolean, unassignedOnly?: boolean }, pagination: PaginationOptions) {
        const { status, assignedOnly, unassignedOnly } = filters;
        const { page, limit } = pagination;

        console.log('Getting lab orders for lab ID:', labId);
        console.log('Filters:', { status, assignedOnly, unassignedOnly });

        let filter: any;
        const labObjectId = new mongoose.Types.ObjectId(labId);

        // Updated filter logic to handle both product orders and prescription orders
        if (assignedOnly) {
            // Only show orders explicitly assigned to this lab by admin
            filter = { laboratoryUser: labObjectId };
            console.log('Filter: Only orders explicitly assigned to this lab by admin');
        } else if (unassignedOnly) {
            // Only show orders that need assignment (prescription orders)
            filter = { needAssignment: true };
            console.log('Filter: Only orders that need assignment (prescription orders)');
        } else {
            // Show orders explicitly assigned to this lab by admin
            // We'll filter product orders in the application layer for now
            filter = { laboratoryUser: labObjectId };
            console.log('Filter: Orders assigned to this lab (will filter product orders in app layer)');
        }

        if (status) {
            filter.status = status;
        }

        console.log('Final lab orders filter:', JSON.stringify(filter, null, 2));

        const skip = (page - 1) * limit;

        const allOrders = await Order.find({}).populate('laboratoryUser', 'name email phone');
        console.log('All orders in DB:', allOrders.map(o => ({
            id: o._id,
            status: o.status,
            needAssignment: o.needAssignment,
            laboratoryUser: o.laboratoryUser?._id || 'null',
            hasProducts: o.products && o.products.length > 0
        })));

        const orders = await Order.find(filter)
            .populate('orderedBy', 'name email phone')
            .populate('laboratoryUser', 'name email phone')
            .populate('deliveryPartner', 'name email phone')
            .populate('products.product', 'name price imageUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Add delivery partner addresses to orders that have delivery partners
        const ordersWithDeliveryAddresses = await Promise.all(
            orders.map(async (order) => {
                if (order.deliveryPartner) {
                    const deliveryPartnerWithAddress = await this.getDeliveryPartnerWithAddress(order.deliveryPartner._id.toString());
                    return {
                        ...order.toObject(),
                        deliveryPartner: deliveryPartnerWithAddress
                    };
                }
                return order.toObject();
            })
        );

        const total = await Order.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        console.log(`Found ${orders.length} lab orders out of ${total} total`);
        console.log('Lab orders found:', orders.map(o => ({
            id: o._id,
            status: o.status,
            needAssignment: o.needAssignment,
            laboratoryUser: o.laboratoryUser?._id || 'null',
            orderedBy: o.orderedBy?._id || 'null',
            hasProducts: o.products && o.products.length > 0,
            orderType: o.products && o.products.length > 0 ? 'Product Order' : 'Prescription Order'
        })));

        return {
            orders: ordersWithDeliveryAddresses,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }

    // Get order by ID (no validation)
    async getOrderById(orderId: string) {
        console.log('Getting order by ID:', orderId);

        const order = await Order.findById(orderId)
            .populate('orderedBy', 'name email phone')
            .populate('laboratoryUser', 'name email phone')
            .populate('deliveryPartner', 'name email phone')
            .populate('products.product', 'name price imageUrl');

        if (order) {
            console.log('Order found:', {
                id: order._id,
                status: order.status,
                needAssignment: order.needAssignment,
                laboratoryUser: order.laboratoryUser?._id || 'null'
            });
            
            // Add delivery partner address if order has delivery partner
            if (order.deliveryPartner) {
                const deliveryPartnerWithAddress = await this.getDeliveryPartnerWithAddress(order.deliveryPartner._id.toString());
                return {
                    ...order.toObject(),
                    deliveryPartner: deliveryPartnerWithAddress
                };
            }
        } else {
            console.log('Order not found for ID:', orderId);
        }

        return order;
    }

    // Update order (no validation)
    async updateOrder(orderId: string, updateData: UpdateOrderData) {
        console.log('Updating order:', orderId, 'with data:', updateData);

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                ...updateData,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('orderedBy', 'name email phone')
         .populate('laboratoryUser', 'name email phone')
         .populate('deliveryPartner', 'name email phone')
         .populate('products.product', 'name price imageUrl');

        console.log('Order updated successfully:', updatedOrder?._id);
        return updatedOrder;
    }

    // Update order status (no validation)
    async updateOrderStatus(orderId: string, status: string) {
        console.log('Updating order status:', orderId, 'to:', status);
        return await this.updateOrder(orderId, { status });
    }

    // Assign laboratory to order (no validation)
    async assignLabToOrder(orderId: string, laboratoryUser: string) {
        console.log('Assigning lab to order:', orderId, 'lab user:', laboratoryUser);
        return await this.updateOrder(orderId, {
            laboratoryUser,
            needAssignment: false,
            status: 'confirmed' // Update status to confirmed when lab is assigned
        });
    }

    // Get orders that need assignment (no validation)
    async getOrdersNeedingAssignment(pagination: PaginationOptions) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;

        console.log('Getting orders needing assignment');

        const orders = await Order.find({ needAssignment: true })
            .populate('orderedBy', 'name email phone')
            .populate('laboratoryUser', 'name email phone')
            .populate('deliveryPartner', 'name email phone')
            .populate('products.product', 'name price imageUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments({ needAssignment: true });
        const totalPages = Math.ceil(total / limit);

        console.log(`Found ${orders.length} orders needing assignment`);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }

    // Calculate order total price (no validation)
    async calculateOrderTotal(products: Array<{ product: string; quantity: number }>) {
        let total = 0;
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (product) {
                total += product.price * item.quantity;
            }
        }
        return total;
    }

    // Get order statistics for admin dashboard (no validation)
    async getOrderStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalOrders,
            pendingOrders,
            completedToday,
            outForDelivery,
            needsAssignment,
            totalRevenue
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({
                status: 'delivered',
                updatedAt: { $gte: today }
            }),
            Order.countDocuments({ status: 'out_for_delivery' }),
            Order.countDocuments({ needAssignment: true }),
            Order.aggregate([
                { $match: { status: 'delivered' } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ])
        ]);

        return {
            totalOrders,
            pendingOrders,
            completedToday,
            outForDelivery,
            needsAssignment,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
        };
    }

    // Get orders by delivery partner ID (no validation)
    async getOrdersByDeliveryPartner(deliveryPartnerId: string, filters: OrderFilters, pagination: PaginationOptions) {
        const { status, createdAt } = filters;
        const { page, limit } = pagination;

        console.log('Getting delivery orders for partner:', deliveryPartnerId);
        console.log('Filters:', { status, createdAt });

        const filter: any = { deliveryPartner: deliveryPartnerId };

        if (status) {
            filter.status = status;
        }

        // Handle date filtering
        if (createdAt) {
            filter.createdAt = createdAt;
        }

        console.log('Delivery orders filter:', filter);

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .populate('orderedBy', 'name email phone')
            .populate('laboratoryUser', 'name email phone')
            .populate('deliveryPartner', 'name email phone')
            .populate('products.product', 'name price imageUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        console.log(`Found ${orders.length} delivery orders for partner ${deliveryPartnerId}`);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }

    // Accept delivery order (no validation)
    async acceptDeliveryOrder(orderId: string) {
        console.log('Accepting delivery order:', orderId);

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                status: 'delivery_accepted',
                acceptedAt: new Date(),
                updatedAt: new Date()
            },
            { new: true }
        ).populate('orderedBy', 'name email phone')
         .populate('laboratoryUser', 'name email phone')
         .populate('deliveryPartner', 'name email phone')
         .populate('products.product', 'name price imageUrl');

        console.log('Delivery order accepted successfully:', updatedOrder?._id);
        return updatedOrder;
    }

    // Reject delivery order (no validation)
    async rejectDeliveryOrder(orderId: string, reason: string) {
        console.log('Rejecting delivery order:', orderId, 'reason:', reason);

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                status: 'delivery_rejected',
                rejectionReason: reason,
                assignedAt: null,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('orderedBy', 'name email phone')
         .populate('laboratoryUser', 'name email phone')
         .populate('deliveryPartner', 'name email phone')
         .populate('products.product', 'name price imageUrl');

        console.log('Delivery order rejected successfully:', updatedOrder?._id);
        return updatedOrder;
    }

    // Update delivery status (no validation)
    async updateDeliveryStatus(orderId: string, status: string) {
        console.log('Updating delivery status for order:', orderId, 'to:', status);

        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const updateData: any = {
            status: status,
            updatedAt: new Date()
        };

        if (status === 'delivered') {
            updateData.deliveredAt = new Date();
            // If the order is COD, mark it as paid upon delivery
            if (order.cod) {
                updateData.isPaid = true;
            }
        } else if (status === 'out_for_delivery') {
            updateData.outForDeliveryAt = new Date();
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        ).populate('orderedBy', 'name email phone')
         .populate('laboratoryUser', 'name email phone')
         .populate('deliveryPartner', 'name email phone')
         .populate('products.product', 'name price imageUrl');

        console.log('Order delivery status updated successfully:', updatedOrder?._id);
        return updatedOrder;
    }

    // Get delivery partner statistics (no validation)
    async getDeliveryPartnerStats(deliveryPartnerId: string) {
        console.log('Getting delivery stats for partner:', deliveryPartnerId);

        const [
            totalOrders,
            completedOrders,
            pendingOrders,
            rejectedOrders,
            averageDeliveryTime
        ] = await Promise.all([
            Order.countDocuments({ deliveryPartner: deliveryPartnerId }),
            Order.countDocuments({
                deliveryPartner: deliveryPartnerId,
                status: 'delivered'
            }),
            Order.countDocuments({
                deliveryPartner: deliveryPartnerId,
                status: { $in: ['delivery_accepted', 'out_for_delivery'] }
            }),
            Order.countDocuments({
                deliveryPartner: deliveryPartnerId,
                status: 'delivery_rejected'
            }),
            Order.aggregate([
                {
                    $match: {
                        deliveryPartner: new mongoose.Types.ObjectId(deliveryPartnerId),
                        status: 'delivered',
                        deliveredAt: { $exists: true },
                        assignedAt: { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgTime: {
                            $avg: {
                                $subtract: ['$deliveredAt', '$assignedAt']
                            }
                        }
                    }
                }
            ])
        ]);

        const avgDeliveryTimeHours = averageDeliveryTime.length > 0
            ? averageDeliveryTime[0].avgTime / (1000 * 60 * 60)
            : 0;

        return {
            totalOrders,
            completedOrders,
            pendingOrders,
            rejectedOrders,
            completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
            averageDeliveryTimeHours: Math.round(avgDeliveryTimeHours * 100) / 100
        };
    }

    // Get available delivery partners for assignment (no validation)
    async getAvailableDeliveryPartners() {
        console.log('Getting available delivery partners');

        try {
            // First, try to get verified delivery partners
            let availablePartners = await User.find({ 
                role: 'deliverypartner',
                isPhoneEmailVerified: true
            }).select('name email phone _id isPhoneEmailVerified');

            // If no verified delivery partners, get all delivery partners
            if (!availablePartners || availablePartners.length === 0) {
                console.log('No verified delivery partners found, getting all delivery partners');
                availablePartners = await User.find({ 
                    role: 'deliverypartner'
                }).select('name email phone _id isPhoneEmailVerified');
            }

            // Filter out any partners missing required fields
            const validPartners = (availablePartners || []).filter(partner =>
                partner.name && partner.email && partner._id
            );

            console.log(`Returning ${validPartners.length} valid delivery partners`);
            return validPartners;
        } catch (error: any) {
            console.error('Error fetching delivery partners:', error?.message || error);
            return [];
        }
    }

    // Get delivery partner details with address
    async getDeliveryPartnerWithAddress(deliveryPartnerId: string) {
        try {
            const { DeliveryBoyProfile } = await import('../models/profileModel');
            const User = (await import('../models/userModel')).default;
            
            console.log('Fetching delivery partner with address for ID:', deliveryPartnerId);
            
            const deliveryPartner = await User.findById(deliveryPartnerId).select('name email phone');
            let deliveryPartnerProfile = await DeliveryBoyProfile.findOne({ user: deliveryPartnerId }).select('address city');
            
            console.log('Delivery partner found:', deliveryPartner);
            console.log('Delivery partner profile found:', deliveryPartnerProfile);
            
            if (!deliveryPartner) {
                console.log('No delivery partner found for ID:', deliveryPartnerId);
                return null;
            }
            
            // If no profile exists, create a basic one
            if (!deliveryPartnerProfile) {
                console.log('No delivery partner profile found, creating basic profile...');
                deliveryPartnerProfile = await DeliveryBoyProfile.create({
                    user: deliveryPartnerId,
                    address: {
                        address: 'Address not set',
                        pinCode: null
                    },
                    city: 'City not set'
                });
                console.log('Created basic delivery partner profile:', deliveryPartnerProfile);
            }
            
            const result = {
                ...deliveryPartner.toObject(),
                profile: deliveryPartnerProfile.toObject()
            };
            
            console.log('Final delivery partner with address result:', result);
            
            return result;
        } catch (error) {
            console.error('Error fetching delivery partner with address:', error);
            return null;
        }
    }

    // Assign order to delivery partner (no validation)
    async assignOrderToDeliveryPartner(orderId: string, deliveryPartnerId: string) {
        console.log('Assigning order to delivery partner:', orderId, 'partner:', deliveryPartnerId);

        const deliveryPartnerObjectId = new mongoose.Types.ObjectId(deliveryPartnerId);
        console.log('Converted delivery partner ID:', deliveryPartnerObjectId);

        const currentOrder = await Order.findById(orderId);
        if (!currentOrder) {
            throw new Error('Order not found');
        }

        let newStatus = 'assigned_to_delivery';
        if (currentOrder.status === 'pending') {
            newStatus = 'confirmed';
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                deliveryPartner: deliveryPartnerObjectId,
                status: newStatus,
                assignedAt: new Date(),
                updatedAt: new Date(),
                ...(newStatus === 'confirmed' && { confirmedAt: new Date() })
            },
            { new: true }
        ).populate('orderedBy', 'name email phone')
         .populate('laboratoryUser', 'name email phone')
         .populate('deliveryPartner', 'name email phone')
         .populate('products.product', 'name price imageUrl');

        if (!updatedOrder) {
            throw new Error('Failed to update order');
        }

        // Get delivery partner details with address
        const deliveryPartnerWithAddress = await this.getDeliveryPartnerWithAddress(deliveryPartnerId);
        
        console.log('Delivery partner with address for assignment:', deliveryPartnerWithAddress);
        
        // Add delivery partner address to the response
        const orderWithDeliveryAddress = {
            ...updatedOrder.toObject(),
            deliveryPartner: deliveryPartnerWithAddress
        };

        console.log('Order assigned to delivery partner successfully:', {
            orderId: orderWithDeliveryAddress._id,
            deliveryPartner: orderWithDeliveryAddress.deliveryPartner,
            status: orderWithDeliveryAddress.status
        });
        return orderWithDeliveryAddress;
    }

    // Update order status with no validation
    async updateOrderStatusWithValidation(orderId: string, newStatus: string, userId: string) {
        console.log('Updating order status:', orderId, 'to:', newStatus, 'by user:', userId);

        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const updateData: any = {
            status: newStatus,
            updatedAt: new Date()
        };

        switch (newStatus) {
            case 'confirmed':
                updateData.confirmedAt = new Date();
                break;
            case 'delivery_accepted':
                updateData.acceptedAt = new Date();
                break;
            case 'out_for_delivery':
                updateData.outForDeliveryAt = new Date();
                break;
            case 'delivered':
                updateData.deliveredAt = new Date();
                break;
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        ).populate('orderedBy', 'name email phone')
         .populate('laboratoryUser', 'name email phone')
         .populate('deliveryPartner', 'name email phone')
         .populate('products.product', 'name price imageUrl');

        console.log('Order status updated successfully:', {
            orderId: updatedOrder?._id,
            oldStatus: order.status,
            newStatus: updatedOrder?.status
        });

        // Add delivery partner address if order has delivery partner
        if (updatedOrder?.deliveryPartner) {
            const deliveryPartnerWithAddress = await this.getDeliveryPartnerWithAddress(updatedOrder.deliveryPartner._id.toString());
            return {
                ...updatedOrder.toObject(),
                deliveryPartner: deliveryPartnerWithAddress
            };
        }

        return updatedOrder;
    }
}

export default new OrderService();