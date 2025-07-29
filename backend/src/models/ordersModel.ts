import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    orderedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    laboratoryUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        quantity: {
            type: Number,
        },
    }],
    prescription: {
        type: String,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    needAssignment: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Custom validation to ensure either products or prescription is provided
orderSchema.pre('save', function(next) {
    const hasProducts = this.products && this.products.length > 0;
    const hasPrescription = this.prescription && this.prescription.trim().length > 0;
    
    if (!hasProducts && !hasPrescription) {
        return next(new Error('Order must have either products or prescription'));
    }
    
    // If products exist, validate each product
    if (hasProducts) {
        for (const productItem of this.products) {
            if (!productItem.product || !productItem.quantity || productItem.quantity <= 0) {
                return next(new Error('Each product must have a valid product ID and quantity'));
            }
        }
    }
    
    next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;