const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

// Page routes
router.get('/', mainController.getHomePage);
router.get('/shop', mainController.getShopPage);
router.get('/cart', mainController.getCartPage);
router.get('/checkout', mainController.getCheckoutPage);
router.get('/admin/products', mainController.getAdminProductsPage);

// API routes for products
router.get('/api/products', mainController.getAllProductsAPI);
router.get('/api/products/:id', mainController.getProductByIdAPI);
router.post('/api/products', mainController.createProductAPI);
router.put('/api/products/:id', mainController.updateProductAPI);
router.delete('/api/products/:id', mainController.deleteProductAPI);

module.exports = router;