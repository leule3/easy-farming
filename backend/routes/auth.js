// Authentication routes: login, registration, logout
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, sanitizeInput } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/login', sanitizeInput, authController.login);
router.post('/register/farmer', validateRegistration, sanitizeInput, authController.registerFarmer);

// Protected routes (require authentication)
router.post('/register', authenticateToken, validateRegistration, sanitizeInput, authController.registerUser);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, sanitizeInput, authController.updateProfile);

module.exports = router;