const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

// Home page
router.get('/', mainController.getHome);

// Shop page
router.get('/shop', mainController.getShop);

// API endpoint for AJAX requests
router.get('/api/products', mainController.getProductsApi);

module.exports = router;