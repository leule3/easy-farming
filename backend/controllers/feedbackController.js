const pool = require('../config/database');

const feedbackController = {
    // Submit feedback
    async submitFeedback(req, res) {
        try {
            const { subject, message, rating } = req.body;

            if (!subject || !message) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Subject and message are required' 
                });
            }

            const [result] = await pool.query(
                'INSERT INTO feedback (subject, message, rating, user_id) VALUES (?, ?, ?, ?)',
                [subject, message, rating || null, req.user.id]
            );

            res.status(201).json({
                success: true,
                message: 'Feedback submitted successfully. Thank you!'
            });
        } catch (error) {
            console.error('Submit feedback error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get feedback (Super Admin only)
    async getFeedback(req, res) {
        try {
            if (req.user.role !== 'super_admin') {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            const [feedback] = await pool.query(
                `SELECT f.*, u.first_name, u.last_name, u.role 
                 FROM feedback f 
                 JOIN users u ON f.user_id = u.id 
                 ORDER BY f.created_at DESC`
            );

            res.json({ success: true, data: feedback });
        } catch (error) {
            console.error('Fetch feedback error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = feedbackController;