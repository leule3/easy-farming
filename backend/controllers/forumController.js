// Forum discussion controller
const pool = require('../config/database');

const forumController = {
    // Get all discussions (with reply count)
    async getDiscussions(req, res) {
        try {
            const [discussions] = await pool.query(
                `SELECT d.*, u.first_name, u.last_name, u.role,
                        (SELECT COUNT(*) FROM forum_replies WHERE discussion_id = d.id) as reply_count
                 FROM forum_discussions d
                 JOIN users u ON d.user_id = u.id
                 ORDER BY d.created_at DESC`
            );

            res.json({ success: true, data: discussions });
        } catch (error) {
            console.error('Fetch discussions error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Create new discussion
    async createDiscussion(req, res) {
        try {
            const { title, content } = req.body;

            if (!title || !content) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Title and content are required' 
                });
            }

            const [result] = await pool.query(
                'INSERT INTO forum_discussions (title, content, user_id) VALUES (?, ?, ?)',
                [title, content, req.user.id]
            );

            res.status(201).json({
                success: true,
                message: 'Discussion created successfully',
                discussion_id: result.insertId
            });
        } catch (error) {
            console.error('Create discussion error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get single discussion with replies
    async getDiscussion(req, res) {
        try {
            const [discussions] = await pool.query(
                `SELECT d.*, u.first_name, u.last_name, u.role
                 FROM forum_discussions d
                 JOIN users u ON d.user_id = u.id
                 WHERE d.id = ?`,
                [req.params.id]
            );

            if (discussions.length === 0) {
                return res.status(404).json({ success: false, message: 'Discussion not found' });
            }

            const [replies] = await pool.query(
                `SELECT r.*, u.first_name, u.last_name, u.role
                 FROM forum_replies r
                 JOIN users u ON r.user_id = u.id
                 WHERE r.discussion_id = ?
                 ORDER BY r.created_at ASC`,
                [req.params.id]
            );

            res.json({
                success: true,
                discussion: discussions[0],
                replies: replies
            });
        } catch (error) {
            console.error('Fetch discussion error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Update discussion (only by author)
    async updateDiscussion(req, res) {
        try {
            const { title, content } = req.body;
            const [discussions] = await pool.query(
                'SELECT user_id FROM forum_discussions WHERE id = ?',
                [req.params.id]
            );

            if (discussions.length === 0) {
                return res.status(404).json({ success: false, message: 'Discussion not found' });
            }

            if (discussions[0].user_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            await pool.query(
                'UPDATE forum_discussions SET title = ?, content = ? WHERE id = ?',
                [title, content, req.params.id]
            );

            res.json({ success: true, message: 'Discussion updated successfully' });
        } catch (error) {
            console.error('Update discussion error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete discussion
    async deleteDiscussion(req, res) {
        try {
            const [discussions] = await pool.query(
                'SELECT user_id FROM forum_discussions WHERE id = ?',
                [req.params.id]
            );

            if (discussions.length === 0) {
                return res.status(404).json({ success: false, message: 'Discussion not found' });
            }

            // Allow delete by author or admin
            if (discussions[0].user_id !== req.user.id && req.user.role !== 'super_admin') {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            await pool.query('DELETE FROM forum_discussions WHERE id = ?', [req.params.id]);

            res.json({ success: true, message: 'Discussion deleted successfully' });
        } catch (error) {
            console.error('Delete discussion error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Add reply to discussion
    async addReply(req, res) {
        try {
            const { reply } = req.body;

            if (!reply) {
                return res.status(400).json({ success: false, message: 'Reply content is required' });
            }

            const [result] = await pool.query(
                'INSERT INTO forum_replies (discussion_id, user_id, reply) VALUES (?, ?, ?)',
                [req.params.id, req.user.id, reply]
            );

            res.status(201).json({
                success: true,
                message: 'Reply added successfully',
                reply_id: result.insertId
            });
        } catch (error) {
            console.error('Add reply error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get replies for discussion
    async getReplies(req, res) {
        try {
            const [replies] = await pool.query(
                `SELECT r.*, u.first_name, u.last_name, u.role
                 FROM forum_replies r
                 JOIN users u ON r.user_id = u.id
                 WHERE r.discussion_id = ?
                 ORDER BY r.created_at ASC`,
                [req.params.id]
            );

            res.json({ success: true, data: replies });
        } catch (error) {
            console.error('Fetch replies error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Update reply (only by author)
    async updateReply(req, res) {
        try {
            const { reply } = req.body;
            const [replies] = await pool.query(
                'SELECT user_id FROM forum_replies WHERE id = ?',
                [req.params.id]
            );

            if (replies.length === 0) {
                return res.status(404).json({ success: false, message: 'Reply not found' });
            }

            if (replies[0].user_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            await pool.query('UPDATE forum_replies SET reply = ? WHERE id = ?', [reply, req.params.id]);

            res.json({ success: true, message: 'Reply updated successfully' });
        } catch (error) {
            console.error('Update reply error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete reply
    async deleteReply(req, res) {
        try {
            const [replies] = await pool.query(
                'SELECT user_id FROM forum_replies WHERE id = ?',
                [req.params.id]
            );

            if (replies.length === 0) {
                return res.status(404).json({ success: false, message: 'Reply not found' });
            }

            if (replies[0].user_id !== req.user.id && req.user.role !== 'super_admin') {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            await pool.query('DELETE FROM forum_replies WHERE id = ?', [req.params.id]);

            res.json({ success: true, message: 'Reply deleted successfully' });
        } catch (error) {
            console.error('Delete reply error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = forumController;