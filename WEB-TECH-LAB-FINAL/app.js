require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const { setCurrentUser } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/golfshop');
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

connectDB();

// ========== MIDDLEWARE SETUP ==========
// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware with MongoStore
app.use(session({
    secret: process.env.SESSION_SECRET || 'golfshop-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false, // Changed to false for better login handling
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/golfshop',
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Global variables middleware (User, Flash messages)
app.use(setCurrentUser);

// EJS setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main-layout');

// ========== ROUTES ==========
// Import routes
const mainRoutes = require('./routes/mainRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');

// Use routes
app.use('/', mainRoutes);
app.use('/', authRoutes); // Auth routes mounted at root
app.use('/admin', adminRoutes);

// ========== DEBUG/HEALTH CHECK ROUTES ==========
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Debug products
app.get('/debug/products', async (req, res) => {
    try {
        const Product = require('./models/Product');
        const products = await Product.find().limit(5);

        res.json({
            success: true,
            count: products.length,
            products: products.map(p => ({
                id: p._id,
                name: p.name,
                price: p.price,
                category: p.category
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Debug session
app.get('/debug/session', (req, res) => {
    res.json({
        sessionId: req.sessionID,
        session: req.session
    });
});

// ========== ERROR HANDLERS ==========
// 404 Error Handler
app.use((req, res, next) => {
    res.status(404).render('pages/404', {
        title: 'Page Not Found - 1GOLF BeGOLF',
        layout: 'layouts/main-layout',
        activePage: '404'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);

    res.status(500).render('pages/error', {
        title: 'Server Error - 1GOLF BeGOLF',
        layout: 'layouts/main-layout',
        activePage: 'error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
        NODE_ENV: process.env.NODE_ENV || 'development'
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
});