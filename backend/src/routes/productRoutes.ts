import { Router } from 'express';
import { 
    createProduct, 
    getAllProducts, 
    getMyProducts, 
    updateProduct, 
    deleteProduct,
    getProductById
} from '../controllers/productController';
import { isAuthenticatedUser } from '../middlewares/auth';

const productRouter = Router();

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

// Get all products with filters and pagination
productRouter.get('/products', getAllProducts);

// Get lab's own products (Lab users only)
productRouter.get('/products/my-products', 
    isAuthenticatedUser, 
    getMyProducts
);

// Get product by ID
productRouter.get('/products/:productId', getProductById);

// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

// Create new product (Lab users only)
productRouter.post('/products', 
    isAuthenticatedUser, 
    createProduct
);

// Update product (Lab users only)
productRouter.put('/products/:productId', 
    isAuthenticatedUser, 
    updateProduct
);

// Delete product (Lab users only)
productRouter.delete('/products/:productId', 
    isAuthenticatedUser, 
    deleteProduct
);

export default productRouter; 