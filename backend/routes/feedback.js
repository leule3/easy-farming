const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

router.use(authenticateToken);

router.post('/', sanitizeInput, feedbackController.submitFeedback);
router.get('/', feedbackController.getFeedback);

module.exports = router;