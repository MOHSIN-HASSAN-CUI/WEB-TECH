require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mainController = require('./controllers/mainController');

const app = express();
const PORT = process.env.PORT || 3000;

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

// 404 handler
app.use(mainController.get404Page);

// Error handler
app.use(mainController.getErrorPage);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});