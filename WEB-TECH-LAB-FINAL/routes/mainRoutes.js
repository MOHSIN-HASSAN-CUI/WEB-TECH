const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const applyDiscount = require('../middleware/applyDiscount');
const { isAuthenticated } = require('../middleware/authMiddleware');

// ========== EXISTING ROUTES ==========

// Home page
router.get('/', async (req, res) => {
    try {
        const featuredProducts = await Product.find({ featured: true }).limit(3);
        res.render('pages/index', {
            title: '1GOLF - BeGOLF Home',
            activePage: 'home',
            featuredProducts
        });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.render('pages/index', {
            title: '1GOLF - BeGOLF Home',
            activePage: 'home',
            featuredProducts: []
        });
    }
});

// Shop page
router.get('/shop', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        const category = req.query.category;
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 10000;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const filter = {
            price: { $gte: minPrice, $lte: maxPrice }
        };

        if (category && category !== 'All') {
            filter.category = category;
        }

        const categories = await Product.distinct('category');
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        const sort = {};
        sort[sortBy] = sortOrder;

        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const priceStats = await Product.aggregate([
            { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
        ]);

        const minPriceOverall = priceStats[0]?.min || 0;
        const maxPriceOverall = priceStats[0]?.max || 1000;

        res.render('pages/products', {
            title: 'Products - 1GOLF BeGOLF',
            activePage: 'shop',
            products,
            categories,
            currentCategory: category,
            currentPage: page,
            totalPages,
            totalProducts,
            limit,
            minPrice,
            maxPrice,
            minPriceOverall,
            maxPriceOverall,
            sortBy,
            sortOrder,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.render('pages/products', {
            title: 'Products - 1GOLF BeGOLF',
            activePage: 'shop',
            products: [],
            categories: [],
            currentPage: 1,
            totalPages: 1,
            totalProducts: 0
        });
    }
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

// API endpoint for AJAX requests
router.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        const category = req.query.category;
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 10000;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const filter = {
            price: { $gte: minPrice, $lte: maxPrice }
        };

        if (category && category !== 'All') {
            filter.category = category;
        }

        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        const sort = {};
        sort[sortBy] = sortOrder;

        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            products,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                limit,
                hasPrevPage: page > 1,
                hasNextPage: page < totalPages,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page < totalPages ? page + 1 : null
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products'
        });
    }
});

// ========== NEW TASK ROUTES ==========

// TASK 1: Order Preview Route
router.get('/order/preview', applyDiscount, (req, res) => {
    try {
        const cart = req.session.cart || [];

        if (cart.length === 0) {
            return res.redirect('/cart');
        }

        let subtotal = 0;
        const itemsWithSubtotals = cart.map(item => {
            const itemSubtotal = item.price * item.quantity;
            subtotal += itemSubtotal;
            return {
                ...item,
                subtotal: itemSubtotal
            };
        });

        const discount = req.discount || 0;
        const discountAmount = subtotal * discount;
        const total = subtotal - discountAmount;

        res.render('pages/order-preview', {
            title: 'Order Preview - 1GOLF BeGOLF',
            activePage: 'order',
            items: itemsWithSubtotals,
            subtotal: subtotal.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            discountPercent: (discount * 100).toFixed(0),
            total: total.toFixed(2),
            couponCode: req.couponCode || '',
            hasCoupon: !!req.couponCode,
            couponError: req.couponError || null
        });
    } catch (error) {
        console.error('Order preview error:', error);
        res.redirect('/cart');
    }
});

// TASK 1: Finalize Order Route
router.post('/order/place', applyDiscount, async (req, res) => {
    console.log('Received order placement request');
    try {
        const cart = req.session.cart || [];
        console.log('Cart length:', cart.length);

        if (cart.length === 0) {
            console.log('Cart is empty, redirecting');
            return res.redirect('/cart');
        }

        const customerEmail = req.body.email || req.session.email || 'guest@example.com';
        console.log('Customer Email:', customerEmail);

        let subtotal = 0;
        const items = cart.map(item => {
            // Handle legacy cart items that might have 'product' instead of 'name'
            const itemName = item.name || item.product || 'Unknown Product';
            const itemQty = item.quantity || 1;
            const itemPrice = parseFloat(item.price);

            const itemSubtotal = itemPrice * itemQty;
            subtotal += itemSubtotal;
            return {
                productId: item.productId,
                name: itemName,
                price: itemPrice,
                quantity: itemQty,
                subtotal: itemSubtotal
            };
        });

        const discount = req.discount || 0;
        const discountAmount = subtotal * discount;
        const total = subtotal - discountAmount;

        const order = new Order({
            customerEmail: customerEmail,
            items: items,
            subtotal: subtotal,
            discount: discountAmount,
            total: total,
            couponCode: req.couponCode || null,
            status: 'Placed'
        });

        console.log('Saving order...');
        await order.save();
        console.log('Order saved successfully.');
        console.log('Order ID:', order.orderId);
        console.log('Redirecting to:', `/order/success/${order.orderId}`);

        req.session.cart = [];

        res.redirect(`/order/success/${order.orderId}`);

    } catch (error) {
        console.error('Order placement error DETAILED:', error);
        // Render the error to the user for better feedback
        res.status(500).send(`Error placing order: ${error.message}`);
    }
});

// TASK 1: Handle missing Order ID (Debugging 404)
router.get('/order/success', (req, res) => {
    console.error('Hit /order/success without ID. Redirecting to home.');
    res.redirect('/');
});

// TASK 1: Order Success Page
router.get('/order/success/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) {
            return res.redirect('/');
        }

        res.render('pages/order-success', {
            title: 'Order Confirmed - 1GOLF BeGOLF',
            activePage: 'order',
            order: order
        });
    } catch (error) {
        console.error('Order success page error:', error);
        res.redirect('/');
    }
});

// TASK 3: Customer Order History
router.get('/my-orders', isAuthenticated, async (req, res) => {
    try {
        // Since user is authenticated, we can fetch orders directly
        const email = req.user.email;

        const orders = await Order.find({ customerEmail: email })
            .sort({ createdAt: -1 });

        res.render('pages/order-history', {
            title: 'My Orders - 1GOLF BeGOLF',
            activePage: 'orders',
            orders: orders,
            email: email,
            error: null
        });
    } catch (error) {
        console.error('Order history error:', error);
        res.render('pages/order-history', {
            title: 'My Orders - 1GOLF BeGOLF',
            activePage: 'orders',
            orders: [],
            email: req.user.email,
            error: 'Error fetching orders'
        });
    }
});

router.post('/my-orders', isAuthenticated, async (req, res) => {
    // Redundant now, but kept for compatibility logic if needed
    res.redirect('/my-orders');
});

// API: Update session cart
router.post('/api/cart/update', (req, res) => {
    req.session.cart = req.body.cart || [];
    res.json({ success: true });
});

// API: Get cart data
router.get('/api/cart', (req, res) => {
    res.json({
        success: true,
        cart: req.session.cart || []
    });
});

module.exports = router;