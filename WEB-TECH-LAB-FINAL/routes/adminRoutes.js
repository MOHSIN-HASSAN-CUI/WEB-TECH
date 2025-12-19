const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// Apply Admin middleware to all routes in this file
router.use(isAdmin);

// Redirect /admin to /admin/dashboard
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Products
router.get('/products', adminController.getProducts);
router.get('/products/add', adminController.getAddProduct);
router.get('/products/edit/:id', adminController.getEditProduct);

// Product APIs
router.post('/api/products', adminController.createProduct);
router.get('/api/products', adminController.getApiProducts);
router.get('/api/products/:id', adminController.getApiProductById);
router.put('/api/products/:id', adminController.updateProduct);
router.delete('/api/products/:id', adminController.deleteProduct);

// Order Management
router.get('/orders', adminController.getOrders);
router.put('/api/orders/:id/status', adminController.updateOrderStatus);
router.get('/orders/:id', adminController.getOrderDetails);

// Users (Placeholder)
router.get('/users', adminController.getUsers);

// Categories (Placeholder)
router.get('/categories', adminController.getCategories);

module.exports = router;