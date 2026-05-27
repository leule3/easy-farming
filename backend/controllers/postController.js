// Post controller with search and warning functionality
const pool = require('../config/database');

const postController = {
    // Create new post (Super Admin only)
    async createPost(req, res) {
        try {
            const { title, content, post_type, warning_type } = req.body;

            const [result] = await pool.query(
                'INSERT INTO posts (title, content, post_type, warning_type, created_by) VALUES (?, ?, ?, ?, ?)',
                [title, content, post_type, warning_type, req.user.id]
            );

            // If warning post, create notifications for all users
            if (post_type === 'warning') {
                const [users] = await pool.query(
                    'SELECT id FROM users WHERE id != ?',
                    [req.user.id]
                );

                const notifications = users.map(user => [
                    user.id,
                    result.insertId,
                    `⚠️ WARNING: ${title}`
                ]);

                if (notifications.length > 0) {
                    await pool.query(
                        'INSERT INTO notifications (user_id, post_id, message) VALUES ?',
                        [notifications]
                    );
                }
            }

            res.status(201).json({
                success: true,
                message: 'Post created successfully',
                post_id: result.insertId
            });
        } catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get all posts (paginated)
    async getAllPosts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const [posts] = await pool.query(
                `SELECT p.*, u.first_name, u.last_name 
                 FROM posts p 
                 JOIN users u ON p.created_by = u.id 
                 WHERE p.is_deleted = 0 AND p.post_type = 'information'
                 ORDER BY p.created_at DESC 
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );

            const [[{ total }]] = await pool.query(
                "SELECT COUNT(*) as total FROM posts WHERE is_deleted = 0 AND post_type = 'information'"
            );

            res.json({
                success: true,
                data: posts,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Fetch posts error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Search posts
    async searchPosts(req, res) {
        try {
            const { query } = req.query;
            
            const [posts] = await pool.query(
                `SELECT p.*, u.first_name, u.last_name 
                 FROM posts p 
                 JOIN users u ON p.created_by = u.id 
                 WHERE p.is_deleted = 0 AND p.post_type = 'information' AND (p.title LIKE ? OR p.content LIKE ?)
                 ORDER BY p.created_at DESC`,
                [`%${query}%`, `%${query}%`]
            );

            res.json({ success: true, data: posts });
        } catch (error) {
            console.error('Search posts error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get warning posts
    async getWarnings(req, res) {
        try {
            const [warnings] = await pool.query(
                `SELECT * FROM posts WHERE post_type = 'warning' AND is_deleted = 0 
                 ORDER BY created_at DESC LIMIT 5`
            );

            res.json({ success: true, data: warnings });
        } catch (error) {
            console.error('Fetch warnings error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get single post
    async getPostById(req, res) {
        try {
            const [posts] = await pool.query(
                `SELECT p.*, u.first_name, u.last_name 
                 FROM posts p 
                 JOIN users u ON p.created_by = u.id 
                 WHERE p.id = ? AND p.is_deleted = 0`,
                [req.params.id]
            );

            if (posts.length === 0) {
                return res.status(404).json({ success: false, message: 'Post not found' });
            }

            res.json({ success: true, data: posts[0] });
        } catch (error) {
            console.error('Fetch post error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Update post
    async updatePost(req, res) {
        try {
            const { title, content, post_type, warning_type } = req.body;
            
            await pool.query(
                'UPDATE posts SET title = ?, content = ?, post_type = ?, warning_type = ? WHERE id = ? AND created_by = ?',
                [title, content, post_type, warning_type, req.params.id, req.user.id]
            );

            res.json({ success: true, message: 'Post updated successfully' });
        } catch (error) {
            console.error('Update post error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete post (soft delete)
    async deletePost(req, res) {
        try {
            await pool.query(
                'UPDATE posts SET is_deleted = 1 WHERE id = ?',
                [req.params.id]
            );

            res.json({ success: true, message: 'Post deleted successfully' });
        } catch (error) {
            console.error('Delete post error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Add private comment
    async addComment(req, res) {
        try {
            const { comment } = req.body;
            
            await pool.query(
                'INSERT INTO private_comments (post_id, user_id, comment) VALUES (?, ?, ?)',
                [req.params.id, req.user.id, comment]
            );

            res.status(201).json({ success: true, message: 'Comment added successfully' });
        } catch (error) {
            console.error('Add comment error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get private comments
    async getComments(req, res) {
        try {
            const [comments] = await pool.query(
                `SELECT pc.*, u.first_name, u.last_name 
                 FROM private_comments pc 
                 JOIN users u ON pc.user_id = u.id 
                 WHERE pc.post_id = ? 
                 ORDER BY pc.created_at DESC`,
                [req.params.id]
            );

            res.json({ success: true, data: comments });
        } catch (error) {
            console.error('Fetch comments error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = postController;