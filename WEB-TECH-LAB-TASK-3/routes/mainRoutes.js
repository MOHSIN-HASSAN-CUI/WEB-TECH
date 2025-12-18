const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
    res.render('pages/index', { 
        title: '1GOLF - BeGOLF Home',
        activePage: 'home'
    });
});

// Shop page
router.get('/shop', (req, res) => {
    res.render('pages/products', { 
        title: 'Products - 1GOLF BeGOLF',
        activePage: 'shop'
    });
});

// Cart page
router.get('/cart', (req, res) => {
    res.render('pages/cart', { 
        title: 'Cart - 1GOLF BeGOLF',
        activePage: 'cart'
    });
});

// Checkout page
router.get('/checkout', (req, res) => {
    res.render('pages/checkout', { 
        title: 'Checkout - 1GOLF BeGOLF',
        activePage: 'checkout'
    });
});

// Admin page (Products CRUD)
router.get('/admin/products', (req, res) => {
    res.render('pages/products-crud', { 
        title: 'Product Management - 1GOLF BeGOLF',
        activePage: 'admin'
    });
});

module.exports = router;