const User = require('../models/User');

// Middleware to check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
       if (req.session.user) {
              return next();
       }
       // Store original URL to redirect back after login
       req.session.returnTo = req.originalUrl;
       req.session.error_msg = 'Please log in to view this resource';
       res.redirect('/login');
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
       if (req.session.user && req.session.user.isAdmin) {
              return next();
       }
       req.session.error_msg = null; // Don't set error message, let the page handle the UI
       res.redirect('/admin/login');
};

// Middleware to make user user available in templates
exports.setCurrentUser = async (req, res, next) => {
       res.locals.user = req.session.user || null;
       res.locals.isAuthenticated = !!req.session.user;
       req.user = req.session.user || null; // Make user available in req object

       // Also make sure flash messages are available
       // Note: This relies on connect-flash being set up in app.js if used
       // If not using connect-flash, we can simulate basic message passing
       res.locals.success_msg = req.session.success_msg || null;
       res.locals.error_msg = req.session.error_msg || null;

       // Clear flash messages after one use
       if (req.method === 'GET') {
              req.session.success_msg = null;
              req.session.error_msg = null;
       }

       next();
};
