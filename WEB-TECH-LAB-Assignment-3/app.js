require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/golfshop');
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

connectDB();
// Debug route - add this near the top of app.js after middleware setup
app.get('/debug/products', async (req, res) => {
    try {
        const Product = require('./models/Product');
        const products = await Product.find();
        
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
        res.json({
            success: false,
            error: error.message
        });
    }
});
// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// EJS setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main-layout');

// Routes
const mainRoutes = require('./routes/mainRoutes');
app.use('/', mainRoutes);

app.use((req, res) => {
    res.status(404).render('pages/404', {
        title: 'Page Not Found',
        layout: 'layouts/main-layout',
        activePage: '404' // Add this line
    });
});

// Update the error handler:
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('pages/error', {
        title: 'Server Error',
        error: err,
        layout: 'layouts/main-layout',
        activePage: 'error', // Add this line
        NODE_ENV: process.env.NODE_ENV || 'development' // Add this line
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});