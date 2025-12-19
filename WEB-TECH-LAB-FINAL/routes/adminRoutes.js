const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');

const { isAdmin } = require('../middleware/authMiddleware');
const { setCurrentUser } = require('../middleware/authMiddleware'); // Verify if this is needed, probably app.js handles it globally

// Apply Admin middleware to all routes in this file
router.use(isAdmin);

// Redirect /admin to /admin/dashboard
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});

// Admin Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalStock = await Product.aggregate([
            { $group: { _id: null, total: { $sum: '$stock' } } }
        ]);
        const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).countDocuments();
        const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name price category stock');
        const productsByCategory = await Product.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } }
        ]);

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
            scripts: []
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
            scripts: []
        });
    }
});

// Products List Page (keep existing)
router.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const search = req.query.search || '';
        const category = req.query.category || '';

        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (category) {
            query.category = category;
        }

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);
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

// Add Product Page (keep existing)
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

// Edit Product Page (keep existing)
router.get('/products/edit/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.redirect('/admin/products');
        }

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

// API Routes for CRUD Operations (keep existing)
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

// ========== TASK 4: ORDER MANAGEMENT ==========

// Orders Page
router.get('/orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.search) {
            query.$or = [
                { orderId: { $regex: req.query.search, $options: 'i' } },
                { customerEmail: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('admin/orders', {
            layout: 'layouts/admin-layout',
            title: 'Order Management',
            activePage: 'orders',
            pageTitle: 'Order Management',
            pageSubtitle: 'View and manage customer orders',
            breadcrumb: [
                { text: 'Orders', active: true }
            ],
            orders: orders,
            currentPage: page,
            totalPages: totalPages,
            totalOrders: totalOrders,
            limit: limit,
            search: req.query.search || '',
            status: req.query.status || '',
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null
        });
    } catch (error) {
        console.error('Orders page error:', error);
        res.render('admin/orders', {
            layout: 'layouts/admin-layout',
            title: 'Order Management',
            activePage: 'orders',
            orders: [],
            scripts: []
        });
    }
});

// Update Order Status (API)
router.put('/api/orders/:id/status', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const newStatus = req.body.status;
        const validStatuses = ['Placed', 'Processing', 'Delivered'];

        const currentIndex = validStatuses.indexOf(order.status);
        const newIndex = validStatuses.indexOf(newStatus);

        if (newIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        if (newIndex > currentIndex + 1) {
            return res.status(400).json({
                success: false,
                message: `Cannot skip status. Current: ${order.status}, Next allowed: ${validStatuses[currentIndex + 1] || 'none'}`
            });
        }

        order.status = newStatus;
        order.updatedAt = Date.now();
        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            order: order
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        });
    }
});

// Admin Order Details
router.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.redirect('/admin/orders');
        }

        res.render('admin/order-details', {
            layout: 'layouts/admin-layout',
            title: 'Order Details',
            activePage: 'orders',
            pageTitle: `Order Details: ${order.orderId}`,
            pageSubtitle: 'View complete order information',
            breadcrumb: [
                { text: 'Orders', link: '/admin/orders' },
                { text: 'Details', active: true }
            ],
            order: order
        });
    } catch (error) {
        console.error('Order details error:', error);
        res.redirect('/admin/orders');
    }
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