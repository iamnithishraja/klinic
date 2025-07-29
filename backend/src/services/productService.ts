import Product from '../models/productModel';
import type { Types } from 'mongoose';

export interface ProductFilters {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    userId?: string;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface ProductData {
    name: string;
    description: string;
    price: number;
    availableQuantity: number;
    imageUrl?: string;
    user: string;
}

export interface UpdateProductData {
    name?: string;
    description?: string;
    price?: number;
    availableQuantity?: number;
    imageUrl?: string;
}

class ProductService {
    /**
     * Create a new product
     */
    async createProduct(productData: ProductData) {
        return await Product.create(productData);
    }

    /**
     * Get all products with filters and pagination
     */
    async getAllProducts(filters: ProductFilters, pagination: PaginationOptions) {
        console.log('ProductService - Received filters:', filters);
        console.log('ProductService - Received pagination:', pagination);
        const { search, minPrice, maxPrice, userId } = filters;
        const { page, limit } = pagination;

        // Build filter object
        const filter: any = {};
        
        if (search && search.trim() !== '') {
            filter.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } }
            ];
        }
        
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = minPrice;
            if (maxPrice) filter.price.$lte = maxPrice;
        }

        if (userId) {
            filter.user = userId;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        
        console.log('Product service - Filters:', filter);
        console.log('Product service - Pagination:', { page, limit, skip });
        
        // Get products with pagination
        const products = await Product.find(filter)
            .populate('user', 'name email')
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Product.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        console.log('Product service - Found products:', products.length);
        console.log('Product service - Total products:', total);

        return {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }

    /**
     * Get products by user ID
     */
    async getProductsByUser(userId: string, pagination: PaginationOptions) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        
        console.log('ProductService.getProductsByUser - User ID:', userId);
        console.log('ProductService.getProductsByUser - Pagination:', pagination);
        
        const products = await Product.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        console.log('ProductService.getProductsByUser - Found products:', products.length);

        const total = await Product.countDocuments({ user: userId });
        const totalPages = Math.ceil(total / limit);

        console.log('ProductService.getProductsByUser - Total products:', total);
        console.log('ProductService.getProductsByUser - Total pages:', totalPages);

        return {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }

    /**
     * Get product by ID
     */
    async getProductById(productId: string) {
        return await Product.findById(productId).populate('user', 'name email');
    }



    /**
     * Update product
     */
    async updateProduct(productId: string, updateData: UpdateProductData) {
        return await Product.findByIdAndUpdate(
            productId,
            {
                ...updateData,
                updatedAt: new Date()
            },
            { new: true }
        );
    }

    /**
     * Delete product
     */
    async deleteProduct(productId: string) {
        return await Product.findByIdAndDelete(productId);
    }

    /**
     * Check if product exists and has sufficient quantity
     */
    async checkProductAvailability(productId: string, quantity: number) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        if (product.availableQuantity < quantity) {
            throw new Error(`Insufficient quantity for product ${product.name}`);
        }
        return product;
    }

    /**
     * Update product quantity (for order processing)
     */
    async updateProductQuantity(productId: string, quantityChange: number) {
        return await Product.findByIdAndUpdate(
            productId,
            { $inc: { availableQuantity: quantityChange } },
            { new: true }
        );
    }

    /**
     * Get products by IDs (for order processing)
     */
    async getProductsByIds(productIds: string[]) {
        return await Product.find({ _id: { $in: productIds } });
    }
}

export default new ProductService();