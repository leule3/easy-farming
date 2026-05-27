const express = require('express');
const router = express.Router();
const innovationController = require('../controllers/innovationController');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/', innovationController.getInnovations);
router.post('/', sanitizeInput, innovationController.createInnovation);
router.get('/:id', innovationController.getInnovation);

module.exports = router;