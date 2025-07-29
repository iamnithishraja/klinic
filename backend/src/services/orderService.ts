import Order from '../models/ordersModel';
import Product from '../models/productModel';
import productService from './productService';
import mongoose from 'mongoose';

export interface OrderFilters {
    status?: string;
    needAssignment?: boolean;
    userId?: string;
    labId?: string;
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
}

export interface UpdateOrderData {
    status?: string;
    laboratoryUser?: string;
    needAssignment?: boolean;
}

class OrderService {
    /**
     * Create a new order
     */
    async createOrder(orderData: OrderData) {
        console.log('Creating order with data:', orderData);
        
        const { products, totalPrice, needAssignment } = orderData;

        // Calculate total price if not provided and products exist
        let calculatedTotalPrice = totalPrice;
        if (products && products.length > 0 && !totalPrice) {
            calculatedTotalPrice = 0;
            for (const item of products) {
                const product = await productService.checkProductAvailability(item.product, item.quantity);
                calculatedTotalPrice += product.price * item.quantity;
            }
        }

        // Create order
        const order = await Order.create({
            ...orderData,
            totalPrice: calculatedTotalPrice || 0
        });

        console.log('Order created successfully:', order._id);

        // Update product quantities if products were ordered
        if (products && products.length > 0) {
            for (const item of products) {
                await productService.updateProductQuantity(item.product, -item.quantity);
            }
        }

        return await this.getOrderById(order._id.toString());
    }

    /**
     * Get all orders with filters and pagination
     */
    async getAllOrders(filters: OrderFilters, pagination: PaginationOptions) {
        const { status, needAssignment, userId, labId } = filters;
        const { page, limit } = pagination;

        console.log('Getting all orders with filters:', filters, 'and pagination:', pagination);

        // Build filter object
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

        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get orders with pagination
        const orders = await Order.find(filter)
            .populate('orderedBy', 'name email phone')
            .populate('laboratoryUser', 'name email phone')
            .populate('deliveryPartner', 'name email phone')
            .populate('products.product', 'name price imageUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
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

    /**
     * Get orders by user ID
     */
    async getOrdersByUser(userId: string, filters: OrderFilters, pagination: PaginationOptions) {
        const { status } = filters;
        const { page, limit } = pagination;

        console.log('Getting orders for user:', userId, 'with filters:', filters);

        // Build filter
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

    /**
     * Get orders by laboratory user ID
     */
    async getOrdersByLab(labId: string, filters: OrderFilters & { assignedOnly?: boolean, unassignedOnly?: boolean }, pagination: PaginationOptions) {
        const { status, assignedOnly, unassignedOnly } = filters;
        const { page, limit } = pagination;

        console.log('Getting lab orders for lab ID:', labId);
        console.log('Filters:', { status, assignedOnly, unassignedOnly });

        let filter: any;
        const labObjectId = new mongoose.Types.ObjectId(labId);
        
        if (assignedOnly) {
            filter = { laboratoryUser: labObjectId };
            console.log('Filter: Only assigned orders to this lab');
        } else if (unassignedOnly) {
            filter = { needAssignment: true };
            console.log('Filter: Only unassigned orders');
        } else {
            filter = {
                $or: [
                    { laboratoryUser: labObjectId },
                    { needAssignment: true }
                ]
            };
            console.log('Filter: Assigned to this lab OR unassigned orders');
        }

        if (status) {
            filter.status = status;
        }

        console.log('Final lab orders filter:', JSON.stringify(filter, null, 2));

        const skip = (page - 1) * limit;
        
        // First, let's check what orders exist in the database
        const allOrders = await Order.find({}).populate('laboratoryUser', 'name email phone');
        console.log('All orders in DB:', allOrders.map(o => ({
            id: o._id,
            status: o.status,
            needAssignment: o.needAssignment,
            laboratoryUser: o.laboratoryUser?._id || 'null'
        })));

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

        console.log(`Found ${orders.length} lab orders out of ${total} total`);
        console.log('Lab orders found:', orders.map(o => ({
            id: o._id,
            status: o.status,
            needAssignment: o.needAssignment,
            laboratoryUser: o.laboratoryUser?._id || 'null',
            orderedBy: o.orderedBy?._id || 'null'
        })));

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

    /**
     * Get order by ID
     */
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
        } else {
            console.log('Order not found for ID:', orderId);
        }

        return order;
    }

    /**
     * Update order
     */
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

    /**
     * Update order status
     */
    async updateOrderStatus(orderId: string, status: string) {
        console.log('Updating order status:', orderId, 'to:', status);
        return await this.updateOrder(orderId, { status });
    }

    /**
     * Assign laboratory to order
     */
    async assignLabToOrder(orderId: string, laboratoryUser: string) {
        console.log('Assigning lab to order:', orderId, 'lab user:', laboratoryUser);
        return await this.updateOrder(orderId, { 
            laboratoryUser, 
            needAssignment: false 
        });
    }

    /**
     * Get orders that need assignment
     */
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

    /**
     * Calculate order total price
     */
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

    /**
     * Get order statistics for admin dashboard
     */
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
}

export default new OrderService(); 