// Forum discussion routes
const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

router.use(authenticateToken);

// Discussion CRUD
router.get('/discussions', forumController.getDiscussions);
router.post('/discussions', sanitizeInput, forumController.createDiscussion);
router.get('/discussions/:id', forumController.getDiscussion);
router.put('/discussions/:id', sanitizeInput, forumController.updateDiscussion);
router.delete('/discussions/:id', forumController.deleteDiscussion);

// Replies
router.post('/discussions/:id/replies', sanitizeInput, forumController.addReply);
router.get('/discussions/:id/replies', forumController.getReplies);
router.put('/replies/:id', sanitizeInput, forumController.updateReply);
router.delete('/replies/:id', forumController.deleteReply);

module.exports = router;