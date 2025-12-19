const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const applyDiscount = require('../middleware/applyDiscount'); // Ensure this is available, if not assume global or need validation
const { isAuthenticated } = require('../middleware/authMiddleware');

// Cart & Checkout Pages
router.get('/cart', orderController.getCart);
router.get('/checkout', orderController.getCheckout);

// Order Processing
router.get('/order/preview', applyDiscount, orderController.previewOrder);
router.post('/order/place', applyDiscount, orderController.placeOrder);

// Success & History
router.get('/order/success', orderController.handleMissingId);
router.get('/order/success/:orderId', orderController.getOrderSuccess);
router.get('/my-orders', isAuthenticated, orderController.getMyOrders);

// Compatibility
router.post('/my-orders', isAuthenticated, (req, res) => {
       res.redirect('/my-orders');
});

// APIs
router.post('/api/cart/update', orderController.updateCartApi);
router.get('/api/cart', orderController.getCartApi);

module.exports = router;
