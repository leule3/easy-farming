const pool = require('../config/database');

const innovationController = {
    // Get innovations (filtered by role)
    async getInnovations(req, res) {
        try {
            let query, params;

            if (req.user.role === 'super_admin') {
                query = `SELECT i.*, u.first_name, u.last_name, u.role 
                         FROM innovations i 
                         JOIN users u ON i.user_id = u.id 
                         ORDER BY i.created_at DESC`;
                params = [];
            } else {
                query = `SELECT * FROM innovations WHERE user_id = ? ORDER BY created_at DESC`;
                params = [req.user.id];
            }

            const [innovations] = await pool.query(query, params);

            res.json({ success: true, data: innovations });
        } catch (error) {
            console.error('Fetch innovations error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Create innovation
    async createInnovation(req, res) {
        try {
            const { title, description, category } = req.body;

            if (!title || !description) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Title and description are required' 
                });
            }

            const [result] = await pool.query(
                'INSERT INTO innovations (title, description, category, user_id) VALUES (?, ?, ?, ?)',
                [title, description, category || 'General', req.user.id]
            );

            // Notify super admins
            const [superAdmins] = await pool.query(
                "SELECT id FROM users WHERE role = 'super_admin'"
            );

            for (const admin of superAdmins) {
                await pool.query(
                    'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                    [admin.id, `New innovation submitted: ${title}`]
                );
            }

            res.status(201).json({
                success: true,
                message: 'Innovation shared successfully',
                innovation_id: result.insertId
            });
        } catch (error) {
            console.error('Create innovation error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get single innovation
    async getInnovation(req, res) {
        try {
            const [innovations] = await pool.query(
                `SELECT i.*, u.first_name, u.last_name, u.role 
                 FROM innovations i 
                 JOIN users u ON i.user_id = u.id 
                 WHERE i.id = ?`,
                [req.params.id]
            );

            if (innovations.length === 0) {
                return res.status(404).json({ success: false, message: 'Innovation not found' });
            }

            if (innovations[0].user_id !== req.user.id && req.user.role !== 'super_admin') {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            res.json({ success: true, data: innovations[0] });
        } catch (error) {
            console.error('Fetch innovation error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = innovationController;