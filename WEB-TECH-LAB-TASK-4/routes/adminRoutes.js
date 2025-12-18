const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Admin middleware (simple version - you can add authentication later)
const isAdmin = (req, res, next) => {
    // For now, just pass through
    // Later you can add authentication logic here
    next();
};

// Apply admin middleware to all routes
router.use(isAdmin);

// Admin Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        // Get stats for dashboard
        const totalProducts = await Product.countDocuments();
        const totalStock = await Product.aggregate([
            { $group: { _id: null, total: { $sum: '$stock' } } }
        ]);
        const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).countDocuments();
        
        // Get recent products
        const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name price category stock');
            
        // Get products by category
        const productsByCategory = await Product.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } }
        ]);
        
        res.render('admin/dashboard', {
            layout: 'layouts/admin-layout',
            title: 'Admin Dashboard',
            activePage: 'dashboard',
            pageTitle: 'Dashboard Overview',
            pageSubtitle: 'Manage your golf e-commerce store',
            breadcrumb: [
                { text: 'Dashboard', active: true }
            ],
            stats: {
                totalProducts,
                totalStock: totalStock[0]?.total || 0,
                lowStockProducts,
                totalValue: await calculateTotalValue()
            },
            recentProducts,
            productsByCategory,
            scripts: [] // Add this line
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('admin/dashboard', {
            layout: 'layouts/admin-layout',
            title: 'Admin Dashboard',
            activePage: 'dashboard',
            stats: { totalProducts: 0, totalStock: 0, lowStockProducts: 0, totalValue: 0 },
            recentProducts: [],
            productsByCategory: [],
            scripts: [] // Add this line
        });
    }
});

// Helper function to calculate total inventory value
async function calculateTotalValue() {
    try {
        const result = await Product.aggregate([
            {
                $project: {
                    value: { $multiply: ['$price', '$stock'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: '$value' }
                }
            }
        ]);
        return result[0]?.totalValue || 0;
    } catch (error) {
        return 0;
    }
}

// Products List Page
router.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Get search/filter parameters
        const search = req.query.search || '';
        const category = req.query.category || '';
        
        // Build query
        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (category) {
            query.category = category;
        }
        
        // Get products with pagination
        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        // Get total count
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);
        
        // Get unique categories for filter
        const categories = await Product.distinct('category');
        
        res.render('admin/products', {
            layout: 'layouts/admin-layout',
            title: 'Product Management',
            activePage: 'products',
            pageTitle: 'Product Management',
            pageSubtitle: 'Manage your product inventory',
            breadcrumb: [
                { text: 'Products', active: true }
            ],
            products,
            categories,
            currentPage: page,
            totalPages,
            totalProducts,
            limit,
            search,
            currentCategory: category,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null
        });
    } catch (error) {
        console.error('Products page error:', error);
        res.render('admin/products', {
            layout: 'layouts/admin-layout',
            title: 'Product Management',
            activePage: 'products',
            products: [],
            categories: [],
            currentPage: 1,
            totalPages: 1,
            totalProducts: 0,
            scripts: []
        });
    }
});

// Add Product Page
router.get('/products/add', (req, res) => {
    res.render('admin/add-product', {
        layout: 'layouts/admin-layout',
        title: 'Add New Product',
        activePage: 'products',
        pageTitle: 'Add New Product',
        pageSubtitle: 'Create a new product for your store',
        breadcrumb: [
            { text: 'Products', link: '/admin/products' },
            { text: 'Add New', active: true }
        ],
        scripts: []
    });
});

// Edit Product Page
router.get('/products/edit/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.redirect('/admin/products');
        }
        
        // Get categories for dropdown
        const categories = await Product.distinct('category');
        
        res.render('admin/edit-product', {
            layout: 'layouts/admin-layout',
            title: 'Edit Product',
            activePage: 'products',
            pageTitle: 'Edit Product',
            pageSubtitle: 'Update product details',
            breadcrumb: [
                { text: 'Products', link: '/admin/products' },
                { text: 'Edit', active: true }
            ],
            product,
            categories,
            scripts: []
        });
    } catch (error) {
        console.error('Edit product error:', error);
        res.redirect('/admin/products');
    }
});

// API Routes for CRUD Operations

// Create Product (POST)
router.post('/api/products', async (req, res) => {
    try {
        const product = new Product({
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            stock: req.body.stock,
            description: req.body.description,
            image: req.body.image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop',
            featured: req.body.featured === 'on'
        });
        
        await product.save();
        
        res.json({
            success: true,
            message: 'Product created successfully!',
            product: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
});

// Read All Products (GET) - JSON API
router.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            products: products.map(p => ({
                _id: p._id,
                name: p.name,
                price: p.price,
                category: p.category,
                stock: p.stock,
                description: p.description,
                image: p.image,
                featured: p.featured,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products'
        });
    }
});

// Read Single Product (GET)
router.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product'
        });
    }
});

// Update Product (PUT)
router.put('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product updated successfully!',
            product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
});

// Delete Product (DELETE)
router.delete('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product deleted successfully!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting product'
        });
    }
});

// Orders Page (Placeholder)
router.get('/orders', (req, res) => {
    res.render('admin/orders', {
        layout: 'layouts/admin-layout',
        title: 'Order Management',
        activePage: 'orders',
        pageTitle: 'Order Management',
        pageSubtitle: 'View and manage customer orders',
        breadcrumb: [], 
        scripts: []
    });
});

// Users Page (Placeholder)
router.get('/users', (req, res) => {
    res.render('admin/users', {
        layout: 'layouts/admin-layout',
        title: 'User Management',
        activePage: 'users',
        pageTitle: 'User Management',
        pageSubtitle: 'Manage customer accounts',
        breadcrumb: [],
        scripts: []
    });
});

// Categories Page (Placeholder)
router.get('/categories', (req, res) => {
    res.render('admin/categories', {
        layout: 'layouts/admin-layout',
        title: 'Category Management',
        activePage: 'categories',
        pageTitle: 'Category Management',
        pageSubtitle: 'Manage product categories',
        breadcrumb: [],
        scripts: []
    });
});

module.exports = router;