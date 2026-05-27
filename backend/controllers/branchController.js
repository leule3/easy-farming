// Branch management controller
const pool = require('../config/database');

const branchController = {
    // Get all branches
    async getAllBranches(req, res) {
        try {
            const [branches] = await pool.query(
                `SELECT b.*, 
                        (SELECT COUNT(*) FROM users WHERE branch_id = b.id AND role = 'da') as da_count,
                        (SELECT COUNT(*) FROM users WHERE branch_id = b.id AND role = 'sms') as sms_count
                 FROM branches b
                 ORDER BY b.branch_name ASC`
            );

            res.json({ success: true, data: branches });
        } catch (error) {
            console.error('Fetch branches error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Create new branch
    async createBranch(req, res) {
        try {
            const { branch_name, location, region, woreda } = req.body;

            if (!branch_name || !location) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Branch name and location are required' 
                });
            }

            // Check for duplicates
            const [existing] = await pool.query(
                'SELECT id FROM branches WHERE branch_name = ?',
                [branch_name]
            );

            if (existing.length > 0) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'Branch with this name already exists' 
                });
            }

            const [result] = await pool.query(
                'INSERT INTO branches (branch_name, location, region, woreda, created_by) VALUES (?, ?, ?, ?, ?)',
                [branch_name, location, region, woreda, req.user.id]
            );

            res.status(201).json({
                success: true,
                message: 'Branch created successfully',
                branch_id: result.insertId
            });
        } catch (error) {
            console.error('Create branch error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Update branch
    async updateBranch(req, res) {
        try {
            const { id } = req.params;
            const { branch_name, location, region, woreda } = req.body;

            const [branches] = await pool.query('SELECT id FROM branches WHERE id = ?', [id]);

            if (branches.length === 0) {
                return res.status(404).json({ success: false, message: 'Branch not found' });
            }

            await pool.query(
                'UPDATE branches SET branch_name = ?, location = ?, region = ?, woreda = ? WHERE id = ?',
                [branch_name, location, region, woreda, id]
            );

            res.json({ success: true, message: 'Branch updated successfully' });
        } catch (error) {
            console.error('Update branch error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete branch
    async deleteBranch(req, res) {
        try {
            const { id } = req.params;

            // Check if branch has users assigned
            const [users] = await pool.query(
                'SELECT COUNT(*) as count FROM users WHERE branch_id = ?',
                [id]
            );

            if (users[0].count > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete branch with assigned users. Reassign users first.' 
                });
            }

            const [result] = await pool.query('DELETE FROM branches WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Branch not found' });
            }

            res.json({ success: true, message: 'Branch deleted successfully' });
        } catch (error) {
            console.error('Delete branch error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = branchController;