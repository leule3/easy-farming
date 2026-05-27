// Branch management routes
const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/', authorizeRoles('super_admin'), branchController.getAllBranches);
router.post('/', authorizeRoles('super_admin'), sanitizeInput, branchController.createBranch);
router.put('/:id', authorizeRoles('super_admin'), sanitizeInput, branchController.updateBranch);
router.delete('/:id', authorizeRoles('super_admin'), branchController.deleteBranch);

module.exports = router;