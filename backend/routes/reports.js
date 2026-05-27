// Problem reporting routes
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/', reportController.getReports);
router.post('/', sanitizeInput, reportController.createReport);
router.get('/:id', reportController.getReport);
router.put('/:id/priority', reportController.togglePriority);

module.exports = router;