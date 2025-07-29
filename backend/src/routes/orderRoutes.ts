import { Router } from 'express';
import { 
    createOrder, 
    getMyOrders, 
    getLabOrders, 
    updateOrderStatus, 
    getOrderDetails,
    getOrderById,
    claimOrder
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
    getLabOrders
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
    claimOrder
);


export default orderRouter; 