const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register
router.get('/register', authController.getRegister);
router.post('/register', authController.register);

// Login
router.get('/login', authController.getLogin);
router.post('/login', authController.login);

// Admin Login
router.get('/admin/login', authController.getAdminLogin);
router.post('/admin/login', authController.adminLogin);

// Logout
router.get('/admin/logout', authController.adminLogout);
router.get('/logout', authController.logout);

module.exports = router;
