// User management routes - CRUD operations for all user types
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Super Admin routes - Manage Branch Admins
router.get('/branch-admins', authorizeRoles('super_admin'), userController.getBranchAdmins);
router.post('/branch-admins', authorizeRoles('super_admin'), sanitizeInput, userController.createBranchAdmin);
router.put('/branch-admins/:id', authorizeRoles('super_admin'), sanitizeInput, userController.updateBranchAdmin);
router.delete('/branch-admins/:id', authorizeRoles('super_admin'), userController.deleteBranchAdmin);

// Branch Admin routes - Manage DAs and SMSs
router.get('/das', authorizeRoles('branch_admin', 'super_admin'), userController.getDAs);
router.post('/das', authorizeRoles('branch_admin', 'super_admin'), sanitizeInput, userController.createDA);
router.put('/das/:id', authorizeRoles('branch_admin', 'super_admin'), sanitizeInput, userController.updateDA);
router.delete('/das/:id', authorizeRoles('branch_admin', 'super_admin'), userController.deleteDA);

router.get('/sms', authorizeRoles('branch_admin', 'super_admin'), userController.getSMSs);
router.post('/sms', authorizeRoles('branch_admin', 'super_admin'), sanitizeInput, userController.createSMS);
router.put('/sms/:id', authorizeRoles('branch_admin', 'super_admin'), sanitizeInput, userController.updateSMS);
router.delete('/sms/:id', authorizeRoles('branch_admin', 'super_admin'), userController.deleteSMS);

// Get all users by role (for admin views)
router.get('/farmers', authorizeRoles('super_admin', 'branch_admin'), userController.getFarmers);
router.put('/farmers/:id', authorizeRoles('super_admin', 'branch_admin'), sanitizeInput, userController.updateFarmer);
router.delete('/farmers/:id', authorizeRoles('super_admin', 'branch_admin'), userController.deleteFarmer);

// Notification routes
router.get('/notifications', userController.getNotifications);
router.put('/notifications/:id/read', userController.markNotificationRead);

// Contact admin
router.post('/contact-admin', authorizeRoles('branch_admin'), sanitizeInput, userController.contactAdmin);

// View admin profile
router.get('/profile/:id', authorizeRoles('super_admin', 'branch_admin'), userController.getUserProfile);

module.exports = router;