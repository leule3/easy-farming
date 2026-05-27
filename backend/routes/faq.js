const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { authenticateToken } = require('../middleware/auth');

// All FAQ chatbot routes require authentication
router.use(authenticateToken);

// Ask Generative AI Route
router.post('/chat', faqController.askAI);

module.exports = router;
