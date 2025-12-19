const productModel = require('../models/productModel');

const mainController = {
    // Home page
    getHomePage: (req, res) => {
        const featuredProducts = productModel.getFeaturedProducts();
        res.render('pages/index', {
            title: '1GOLF - BeGOLF Home',
            activePage: 'home',
            featuredProducts: featuredProducts
        });
    },

    // Shop page
    getShopPage: (req, res) => {
        const allProducts = productModel.getAllProducts();
        res.render('pages/products', {
            title: 'Products - 1GOLF BeGOLF',
            activePage: 'shop',
            products: allProducts
        });
    },

    // Cart page
    getCartPage: (req, res) => {
        res.render('pages/cart', {
            title: 'Cart - 1GOLF BeGOLF',
            activePage: 'cart'
        });
    },

    // Checkout page
    getCheckoutPage: (req, res) => {
        res.render('pages/checkout', {
            title: 'Checkout - 1GOLF BeGOLF',
            activePage: 'checkout'
        });
    },

    // Admin products page
    getAdminProductsPage: (req, res) => {
        const allProducts = productModel.getAllProducts();
        res.render('pages/products-crud', {
            title: 'Product Management - 1GOLF BeGOLF',
            activePage: 'admin',
            products: allProducts
        });
    },

    // Get all products (API endpoint)
    getAllProductsAPI: (req, res) => {
        const products = productModel.getAllProducts();
        res.json(products);
    },

    // Get single product (API endpoint)
    getProductByIdAPI: (req, res) => {
        const product = productModel.getProductById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    },

    // Create product (API endpoint)
    createProductAPI: (req, res) => {
        const newProduct = productModel.addProduct(req.body);
        res.status(201).json(newProduct);
    },

    // Update product (API endpoint)
    updateProductAPI: (req, res) => {
        const updatedProduct = productModel.updateProduct(req.params.id, req.body);
        if (updatedProduct) {
            res.json(updatedProduct);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    },

    // Delete product (API endpoint)
    deleteProductAPI: (req, res) => {
        const deletedProduct = productModel.deleteProduct(req.params.id);
        if (deletedProduct) {
            res.json({ message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    },

    // 404 handler
    get404Page: (req, res) => {
        res.status(404).render('pages/404', {
            title: 'Page Not Found',
            layout: 'layouts/main-layout'
        });
    },

    // Error handler
    getErrorPage: (err, req, res, next) => {
        console.error(err.stack);
        res.status(500).render('pages/error', {
            title: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? err : null,
            layout: 'layouts/main-layout'
        });
    }
};

module.exports = mainController;