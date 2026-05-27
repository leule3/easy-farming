// Problem report controller
const pool = require('../config/database');

const reportController = {
    // Get all reports (filtered by role)
    async getReports(req, res) {
        try {
            let query, params;

            if (req.user.role === 'super_admin') {
                // Super admin sees all reports
                query = `SELECT pr.*, u.first_name, u.last_name, u.role 
                         FROM problem_reports pr 
                         JOIN users u ON pr.user_id = u.id 
                         ORDER BY pr.is_prioritized DESC, pr.created_at DESC`;
                params = [];
            } else if (req.user.role === 'branch_admin') {
                // Branch admin sees reports from their branch only
                query = `SELECT pr.*, u.first_name, u.last_name, u.role 
                         FROM problem_reports pr 
                         JOIN users u ON pr.user_id = u.id 
                         WHERE u.branch_id = ?
                         ORDER BY pr.is_prioritized DESC, pr.created_at DESC`;
                params = [req.user.branch_id];
            } else {
                // Regular users see only their reports
                query = `SELECT * FROM problem_reports WHERE user_id = ? ORDER BY is_prioritized DESC, created_at DESC`;
                params = [req.user.id];
            }

            const [reports] = await pool.query(query, params);

            res.json({ success: true, data: reports });
        } catch (error) {
            console.error('Fetch reports error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Create new report
    async createReport(req, res) {
        try {
            const { title, description, location, severity } = req.body;

            if (!title || !description) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Title and description are required' 
                });
            }

            // AI Priority Classifier Helper
            // Analyzes report keywords and severity metrics to automatically prioritize emergency issues
            const criticalKeywords = [
                'pest', 'locust', 'swarm', 'drought', 'flood', 'disease', 
                'infestation', 'outbreak', 'rot', 'rust', 'ruined', 'dead', 
                'crop loss', 'loss', 'water', 'scarcity', 'failure', 'die', 'dying',
                'emergency', 'critical', 'danger', 'crisis', 'urgent', 'disaster'
            ];
            
            const textToAnalyze = `${title} ${description}`.toLowerCase();
            const hasUrgentKeyword = criticalKeywords.some(keyword => textToAnalyze.includes(keyword));
            const isPrioritized = (severity === 'critical' || severity === 'high' || hasUrgentKeyword) ? 1 : 0;

            const [result] = await pool.query(
                'INSERT INTO problem_reports (title, description, location, severity, is_prioritized, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                [title, description, location, severity || 'medium', isPrioritized, req.user.id]
            );

            // Fetch user's branch_id to see if they belong to a branch (needed for branch admin alerts)
            const [[submitter]] = await pool.query(
                'SELECT branch_id FROM users WHERE id = ?',
                [req.user.id]
            );

            const isCritical = severity === 'critical';
            const adminMsg = isCritical 
                ? `🚨 CRITICAL REPORT: ${title}` 
                : `New problem report: ${title}`;

            // Notify all super admins
            const [superAdmins] = await pool.query(
                "SELECT id FROM users WHERE role = 'super_admin'"
            );

            for (const admin of superAdmins) {
                await pool.query(
                    'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                    [admin.id, adminMsg]
                );
            }

            // If critical, notify branch admins of the user's branch
            if (isCritical && submitter && submitter.branch_id) {
                const [branchAdmins] = await pool.query(
                    "SELECT id FROM users WHERE role = 'branch_admin' AND branch_id = ?",
                    [submitter.branch_id]
                );
                for (const admin of branchAdmins) {
                    await pool.query(
                        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                        [admin.id, `🚨 CRITICAL REPORT IN YOUR BRANCH: ${title}`]
                    );
                }
            }

            res.status(201).json({
                success: true,
                message: 'Problem reported successfully',
                report_id: result.insertId,
                is_prioritized: isPrioritized
            });
        } catch (error) {
            console.error('Create report error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get single report
    async getReport(req, res) {
        try {
            const [reports] = await pool.query(
                `SELECT pr.*, u.first_name, u.last_name, u.role 
                 FROM problem_reports pr 
                 JOIN users u ON pr.user_id = u.id 
                 WHERE pr.id = ?`,
                [req.params.id]
            );

            if (reports.length === 0) {
                return res.status(404).json({ success: false, message: 'Report not found' });
            }

            // Check permissions
            if (reports[0].user_id !== req.user.id && req.user.role !== 'super_admin') {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            res.json({ success: true, data: reports[0] });
        } catch (error) {
            console.error('Fetch report error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Toggle report priority
    async togglePriority(req, res) {
        try {
            if (req.user.role !== 'super_admin' && req.user.role !== 'branch_admin') {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
            
            const [report] = await pool.query('SELECT is_prioritized FROM problem_reports WHERE id = ?', [req.params.id]);
            if (report.length === 0) {
                return res.status(404).json({ success: false, message: 'Report not found' });
            }
            
            const newStatus = report[0].is_prioritized ? 0 : 1;
            await pool.query('UPDATE problem_reports SET is_prioritized = ? WHERE id = ?', [newStatus, req.params.id]);
            
            res.json({ success: true, message: 'Priority updated successfully', is_prioritized: newStatus });
        } catch (error) {
            console.error('Toggle priority error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = reportController;