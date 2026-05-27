// Post routes: CRUD operations and warnings
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

// Public routes (require authentication)
router.get('/', authenticateToken, postController.getAllPosts);
router.get('/search', authenticateToken, postController.searchPosts);
router.get('/warnings', authenticateToken, postController.getWarnings);
router.get('/:id', authenticateToken, postController.getPostById);

// Super admin only routes
router.post('/', authenticateToken, authorizeRoles('super_admin'), sanitizeInput, postController.createPost);
router.put('/:id', authenticateToken, authorizeRoles('super_admin'), sanitizeInput, postController.updatePost);
router.delete('/:id', authenticateToken, authorizeRoles('super_admin'), postController.deletePost);

// Private comments
router.post('/:id/comments', authenticateToken, sanitizeInput, postController.addComment);
router.get('/:id/comments', authenticateToken, postController.getComments);

module.exports = router;