import { Router } from 'express';
import { 
    createOrder, 
    getMyOrders, 
    getLabOrders, 
    updateOrderStatus, 
    getOrderDetails,
    getOrderById,
    claimOrder,
    assignDeliveryPartner,
    getAvailableDeliveryPartners,
    getLabOrdersWithAddresses
} from '../controllers/orderController';
import { isAuthenticatedUser, checkRole } from '../middlewares/auth';
import { UserRole } from '../types/userTypes';

const orderRouter = Router();

// ========================================
// USER/PATIENT ROUTES
// ========================================

// Create new order
orderRouter.post('/orders', 
    isAuthenticatedUser, 
    createOrder
);

// Get user's orders
orderRouter.get('/orders/my-orders', 
    isAuthenticatedUser, 
    getMyOrders
);

// Get lab's assigned orders
orderRouter.get('/orders/lab-orders', 
    isAuthenticatedUser, 
    (req, res, next) => checkRole(req, res, next, [UserRole.LABORATORY]),
    getLabOrders
);

// Get lab orders with customer addresses
orderRouter.get('/orders/lab-orders-with-addresses', 
    isAuthenticatedUser, 
    (req, res, next) => checkRole(req, res, next, [UserRole.LABORATORY]),
    getLabOrdersWithAddresses
);

// Get available delivery partners (Lab User) - MUST BE BEFORE /:orderId route
orderRouter.get('/orders/available-delivery-partners', 
    isAuthenticatedUser, 
    (req, res, next) => checkRole(req, res, next, [UserRole.LABORATORY]),
    getAvailableDeliveryPartners
);

// Get order details (public access)
orderRouter.get('/orders/:orderId', 
    isAuthenticatedUser, 
    getOrderDetails
);

// ========================================
// LABORATORY ROUTES
// ========================================

// Update order status (public access)
orderRouter.put('/orders/:orderId/status', 
    isAuthenticatedUser, 
    updateOrderStatus
);

// Claim order for laboratory (Lab User)
orderRouter.post('/orders/:orderId/claim', 
    isAuthenticatedUser, 
    (req, res, next) => checkRole(req, res, next, [UserRole.LABORATORY]),
    claimOrder
);

// Assign delivery partner to order (Lab User)
orderRouter.post('/orders/:orderId/assign-delivery', 
    isAuthenticatedUser, 
    (req, res, next) => checkRole(req, res, next, [UserRole.LABORATORY]),
    assignDeliveryPartner
);

export default orderRouter; 