import { Router } from 'express';
import { 
    getDeliveryOrders, 
    acceptOrder, 
    rejectOrder, 
    updateDeliveryStatus,
    getDeliveryProfile,
    getDeliveryStats
} from '../controllers/deliveryController';
import { isAuthenticatedUser, checkRole } from '../middlewares/auth';

const deliveryRouter = Router();

// ========================================
// DELIVERY PARTNER ROUTES
// ========================================

import { UserRole } from '../types/userTypes';

// Get orders assigned to delivery partner
deliveryRouter.get('/delivery/orders', 
    isAuthenticatedUser,
    (req, res, next) => checkRole(req, res, next, [UserRole.DELIVERY_BOY]),
    getDeliveryOrders
);

// Accept assigned order
deliveryRouter.post('/delivery/orders/:orderId/accept', 
    isAuthenticatedUser,
    (req, res, next) => checkRole(req, res, next, [UserRole.DELIVERY_BOY]),
    acceptOrder
);

// Reject assigned order
deliveryRouter.post('/delivery/orders/:orderId/reject', 
    isAuthenticatedUser,
    (req, res, next) => checkRole(req, res, next, [UserRole.DELIVERY_BOY]),
    rejectOrder
);

// Update delivery status
deliveryRouter.put('/delivery/orders/:orderId/status', 
    isAuthenticatedUser,
    (req, res, next) => checkRole(req, res, next, [UserRole.DELIVERY_BOY]),
    updateDeliveryStatus
);



// Get delivery partner profile
deliveryRouter.get('/delivery/profile', 
    isAuthenticatedUser,
    (req, res, next) => checkRole(req, res, next, [UserRole.DELIVERY_BOY]),
    getDeliveryProfile
);

// Get delivery partner statistics
deliveryRouter.get('/delivery/stats', 
    isAuthenticatedUser,
    (req, res, next) => checkRole(req, res, next, [UserRole.DELIVERY_BOY]),
    getDeliveryStats
);

export default deliveryRouter; 