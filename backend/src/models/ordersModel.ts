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
        required: false, // Make it optional
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: false, // Make it optional
        },
        quantity: {
            type: Number,
            required: false, // Make it optional
        },
    }],
    prescription: {
        type: String,
    },
    totalPrice: {
        type: Number,
        required: false, // Make it optional
        default: 0,
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    cod: {
        type: Boolean,
        default: false,
    },
    needAssignment: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['pending', 'pending_assignment', 'confirmed', 'assigned_to_delivery', 'delivery_accepted', 'out_for_delivery', 'delivered', 'delivery_rejected', 'cancelled'],
        default: 'pending',
    },
    // Customer address for delivery
    customerAddress: {
        type: String,
        default: null,
    },
    customerPinCode: {
        type: String,
        default: null,
    },
    // Delivery tracking timestamps
    assignedAt: {
        type: Date,
        default: null,
    },
    acceptedAt: {
        type: Date,
        default: null,
    },
    outForDeliveryAt: {
        type: Date,
        default: null,
    },
    deliveredAt: {
        type: Date,
        default: null,
    },
    rejectionReason: {
        type: String,
        default: null,
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

// Removed validation to allow flexible order creation
// orderSchema.pre('save', function(next) {
//     next();
// });

const Order = mongoose.model('Order', orderSchema);

export default Order;