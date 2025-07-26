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
    delivaryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    products: {
        type: Array,
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
    },
    presciption: {
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
    needAssinment: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: [ 'confirmed','out for delivery', 'delivered'],
        default: 'confirmed',
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

const Order = mongoose.model('Order', orderSchema);

export default Order;