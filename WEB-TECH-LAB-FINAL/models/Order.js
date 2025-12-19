const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: true,
        default: () => 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    },
    customerEmail: {
        type: String,
        required: true,
        trim: true
    },
    items: [{
        name: String,
        price: Number,
        quantity: Number,
        subtotal: Number
    }],
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Placed', 'Processing', 'Delivered'],
        default: 'Placed'
    },
    couponCode: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});



const Order = mongoose.model('Order', orderSchema);

module.exports = Order;