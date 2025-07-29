import type { Request, Response } from 'express';
import type { CustomRequest } from '../types/userTypes';
import productService from '../services/productService';
import { checkRole } from '../middlewares/auth';

// Create Product (Lab User Only)
const createProduct = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { name, description, price, availableQuantity, imageUrl } = req.body;
        const userId = req.user._id;

        // Create product using service
        const product = await productService.createProduct({
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            availableQuantity: Number(availableQuantity),
            imageUrl: imageUrl ? imageUrl.trim() : '',
            user: userId.toString()
        });

        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully'
        });
    } catch (error: any) {
        console.error('Create product error:', error);
        
        if (error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                error: 'Validation error: ' + error.message
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Internal server error' 
            });
        }
    }
};

// Get All Products (Public)
const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
        
        // Validate and sanitize inputs
        const filters = {
            search: search && String(search).trim() !== '' ? String(search).trim() : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined
        };

        const pagination = {
            page: Math.max(1, Number(page)),
            limit: Math.min(100, Math.max(1, Number(limit)))
        };

        const result = await productService.getAllProducts(filters, pagination);

        res.status(200).json({
            success: true,
            data: {
                products: result.products,
                pagination: result.pagination
            }
        });
    } catch (error: any) {
        console.error('Get all products error:', error);
        
        if (error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                error: 'Invalid query parameters: ' + error.message
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Internal server error' 
            });
        }
    }
};

// Get Product by ID (Public)
const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        if (!productId || productId.length !== 24) {
            res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
            return;
        }
        const product = await productService.getProductById(productId);
        if (!product) {
            res.status(404).json({
                success: false,
                error: 'Product not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error: any) {
        console.error('Get product by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Get Lab's Products (Lab User Only)
const getMyProducts = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        console.log('GetMyProducts - User ID:', userId);
        console.log('GetMyProducts - Page:', page);
        console.log('GetMyProducts - Limit:', limit);

        const pagination = {
            page: Math.max(1, Number(page)),
            limit: Math.min(100, Math.max(1, Number(limit)))
        };

        console.log('GetMyProducts - Pagination:', pagination);

        const result = await productService.getProductsByUser(userId.toString(), pagination);

        console.log('GetMyProducts - Result products count:', result.products.length);
        console.log('GetMyProducts - Result pagination:', result.pagination);

        res.status(200).json({
            success: true,
            data: {
                products: result.products,
                pagination: result.pagination
            }
        });
    } catch (error: any) {
        console.error('Get my products error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Update Product (Lab User Only or Admin)
const updateProduct = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        const { name, description, price, availableQuantity, imageUrl } = req.body;
        const userId = req.user._id;

        // Prepare update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (price !== undefined) updateData.price = Number(price);
        if (availableQuantity !== undefined) updateData.availableQuantity = Number(availableQuantity);
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : '';

        // Update product using service
        const updatedProduct = await productService.updateProduct(productId, updateData);

        res.status(200).json({
            success: true,
            data: updatedProduct,
            message: 'Product updated successfully'
        });
    } catch (error: any) {
        console.error('Update product error:', error);
        
        if (error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                error: 'Validation error: ' + error.message
            });
        } else if (error.name === 'CastError') {
            res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Internal server error' 
            });
        }
    }
};

// Delete Product (Lab User Only)
const deleteProduct = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        // Delete product using service
        await productService.deleteProduct(productId);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete product error:', error);
        
        if (error.name === 'CastError') {
            res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Internal server error' 
            });
        }
    }
};

export {
    createProduct,
    getAllProducts,
    getProductById,
    getMyProducts,
    updateProduct,
    deleteProduct
}; 