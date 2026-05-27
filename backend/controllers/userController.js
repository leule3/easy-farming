// User management controller - Full CRUD with role validation
const bcrypt = require('bcrypt');
const pool = require('../config/database');

const userController = {
    // Get all Branch Admins (for Super Admin)
    async getBranchAdmins(req, res) {
        try {
            const [admins] = await pool.query(
                `SELECT u.id, u.first_name, u.last_name, u.phone_number, u.email, 
                        u.sex, u.status, u.branch_id, b.branch_name, u.created_at
                 FROM users u
                 LEFT JOIN branches b ON u.branch_id = b.id
                 WHERE u.role = 'branch_admin'
                 ORDER BY u.created_at DESC`
            );
            res.json({ success: true, data: admins });
        } catch (error) {
            console.error('Fetch branch admins error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Create Branch Admin (Super Admin only)
    async createBranchAdmin(req, res) {
        try {
            const { first_name, last_name, phone_number, password, sex, branch_id } = req.body;

            // Validate phone number
            if (!/^09\d{8}$/.test(phone_number)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid phone number format. Use 09XXXXXXXX' 
                });
            }

            // Check for duplicates
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE phone_number = ?',
                [phone_number]
            );
            if (existing.length > 0) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'A user with this phone number already exists' 
                });
            }

            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            const [result] = await pool.query(
                `INSERT INTO users (first_name, last_name, phone_number, password_hash, sex, role, branch_id, created_by) 
                 VALUES (?, ?, ?, ?, ?, 'branch_admin', ?, ?)`,
                [first_name, last_name, phone_number, password_hash, sex, branch_id, req.user.id]
            );

            res.status(201).json({
                success: true,
                message: 'Branch admin created successfully',
                user_id: result.insertId
            });
        } catch (error) {
            console.error('Create branch admin error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Update Branch Admin
    async updateBranchAdmin(req, res) {
        try {
            const { id } = req.params;
            const { first_name, last_name, phone_number, email, sex, branch_id, status } = req.body;

            // Verify user exists and is branch admin
            const [users] = await pool.query(
                'SELECT id FROM users WHERE id = ? AND role = ?',
                [id, 'branch_admin']
            );
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'Branch admin not found' });
            }

            // Check phone number uniqueness if changed
            const [duplicates] = await pool.query(
                'SELECT id FROM users WHERE phone_number = ? AND id != ?',
                [phone_number, id]
            );
            if (duplicates.length > 0) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'Phone number already in use' 
                });
            }

            await pool.query(
                `UPDATE users 
                 SET first_name = ?, last_name = ?, phone_number = ?, email = ?, 
                     sex = ?, branch_id = ?, status = ?
                 WHERE id = ?`,
                [first_name, last_name, phone_number, email, sex, branch_id, status, id]
            );

            res.json({ success: true, message: 'Branch admin updated successfully' });
        } catch (error) {
            console.error('Update branch admin error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete Branch Admin
    async deleteBranchAdmin(req, res) {
        try {
            const { id } = req.params;

            const [result] = await pool.query(
                'DELETE FROM users WHERE id = ? AND role = ?',
                [id, 'branch_admin']
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Branch admin not found' });
            }

            res.json({ success: true, message: 'Branch admin deleted successfully' });
        } catch (error) {
            console.error('Delete branch admin error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get all DAs
    async getDAs(req, res) {
        try {
            let query = `SELECT id, first_name, last_name, phone_number, email, sex, 
                                status, branch_id, profile_photo, created_at 
                         FROM users WHERE role = 'da'`;
            const params = [];

            // Branch admin can only see their branch's DAs
            if (req.user.role === 'branch_admin') {
                query += ' AND branch_id = ?';
                params.push(req.user.branch_id);
            }

            query += ' ORDER BY created_at DESC';

            const [das] = await pool.query(query, params);
            res.json({ success: true, data: das });
        } catch (error) {
            console.error('Fetch DAs error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Create DA
    async createDA(req, res) {
        try {
            const { first_name, last_name, phone_number, password, sex } = req.body;

            if (!/^09\d{8}$/.test(phone_number)) {
                return res.status(400).json({ success: false, message: 'Invalid phone number' });
            }

            const [existing] = await pool.query(
                'SELECT id FROM users WHERE phone_number = ?', [phone_number]
            );
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: 'Phone number already exists' });
            }

            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            const targetBranch_id = req.user.role === 'super_admin' ? req.body.branch_id : req.user.branch_id;
            const [result] = await pool.query(
                `INSERT INTO users (first_name, last_name, phone_number, password_hash, sex, role, branch_id, created_by) 
                 VALUES (?, ?, ?, ?, ?, 'da', ?, ?)`,
                [first_name, last_name, phone_number, password_hash, sex, targetBranch_id, req.user.id]
            );

            res.status(201).json({
                success: true,
                message: 'Development Agent created successfully',
                user_id: result.insertId
            });
        } catch (error) {
            console.error('Create DA error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Update DA
    async updateDA(req, res) {
        try {
            const { id } = req.params;
            const { first_name, last_name, phone_number, email, sex, status } = req.body;

            // Verify user is DA in same branch (for branch admin)
            let authQuery = 'SELECT id FROM users WHERE id = ? AND role = ?';
            const authParams = [id, 'da'];
            if (req.user.role !== 'super_admin') {
                authQuery += ' AND branch_id = ?';
                authParams.push(req.user.branch_id);
            }
            
            const [users] = await pool.query(authQuery, authParams);
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'DA not found or access denied' });
            }

            await pool.query(
                `UPDATE users SET first_name = ?, last_name = ?, phone_number = ?, email = ?, sex = ?, status = ?
                 WHERE id = ?`,
                [first_name, last_name, phone_number, email, sex, status, id]
            );

            res.json({ success: true, message: 'DA updated successfully' });
        } catch (error) {
            console.error('Update DA error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete DA
    async deleteDA(req, res) {
        try {
            const { id } = req.params;

            let delQuery = 'DELETE FROM users WHERE id = ? AND role = ?';
            const delParams = [id, 'da'];
            if (req.user.role !== 'super_admin') {
                delQuery += ' AND branch_id = ?';
                delParams.push(req.user.branch_id);
            }
            
            const [result] = await pool.query(delQuery, delParams);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'DA not found' });
            }

            res.json({ success: true, message: 'DA deleted successfully' });
        } catch (error) {
            console.error('Delete DA error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get all SMSs
    async getSMSs(req, res) {
        try {
            let query = `SELECT id, first_name, last_name, phone_number, email, sex, 
                                status, profile_photo, created_at 
                         FROM users WHERE role = 'sms'`;
            const params = [];

            if (req.user.role === 'branch_admin') {
                query += ' AND branch_id = ?';
                params.push(req.user.branch_id);
            }

            query += ' ORDER BY created_at DESC';

            const [sms] = await pool.query(query, params);
            res.json({ success: true, data: sms });
        } catch (error) {
            console.error('Fetch SMSs error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Create SMS
    async createSMS(req, res) {
        try {
            const { first_name, last_name, phone_number, password, sex } = req.body;

            if (!/^09\d{8}$/.test(phone_number)) {
                return res.status(400).json({ success: false, message: 'Invalid phone number' });
            }

            const [existing] = await pool.query(
                'SELECT id FROM users WHERE phone_number = ?', [phone_number]
            );
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: 'Phone number already exists' });
            }

            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            const targetBranch_id = req.user.role === 'super_admin' ? req.body.branch_id : req.user.branch_id;
            const [result] = await pool.query(
                `INSERT INTO users (first_name, last_name, phone_number, password_hash, sex, role, branch_id, created_by) 
                 VALUES (?, ?, ?, ?, ?, 'sms', ?, ?)`,
                [first_name, last_name, phone_number, password_hash, sex, targetBranch_id, req.user.id]
            );

            res.status(201).json({
                success: true,
                message: 'SMS created successfully',
                user_id: result.insertId
            });
        } catch (error) {
            console.error('Create SMS error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Update SMS
    async updateSMS(req, res) {
        try {
            const { id } = req.params;
            const { first_name, last_name, phone_number, email, sex, status } = req.body;

            let authQuery = 'SELECT id FROM users WHERE id = ? AND role = ?';
            const authParams = [id, 'sms'];
            if (req.user.role !== 'super_admin') {
                authQuery += ' AND branch_id = ?';
                authParams.push(req.user.branch_id);
            }

            const [users] = await pool.query(authQuery, authParams);
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'SMS not found or access denied' });
            }

            await pool.query(
                `UPDATE users SET first_name = ?, last_name = ?, phone_number = ?, email = ?, sex = ?, status = ?
                 WHERE id = ?`,
                [first_name, last_name, phone_number, email, sex, status, id]
            );

            res.json({ success: true, message: 'SMS updated successfully' });
        } catch (error) {
            console.error('Update SMS error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete SMS
    async deleteSMS(req, res) {
        try {
            const { id } = req.params;

            let delQuery = 'DELETE FROM users WHERE id = ? AND role = ?';
            const delParams = [id, 'sms'];
            if (req.user.role !== 'super_admin') {
                delQuery += ' AND branch_id = ?';
                delParams.push(req.user.branch_id);
            }

            const [result] = await pool.query(delQuery, delParams);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'SMS not found' });
            }

            res.json({ success: true, message: 'SMS deleted successfully' });
        } catch (error) {
            console.error('Delete SMS error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get farmers list (admin view)
    async getFarmers(req, res) {
        try {
            const [farmers] = await pool.query(
                `SELECT id, first_name, last_name, phone_number, email, sex, status, created_at 
                 FROM users WHERE role = 'farmer' ORDER BY created_at DESC`
            );
            res.json({ success: true, data: farmers });
        } catch (error) {
            console.error('Fetch farmers error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Update Farmer
    async updateFarmer(req, res) {
        try {
            const { id } = req.params;
            const { first_name, last_name, phone_number, email, sex, status } = req.body;
            await pool.query(
                `UPDATE users SET first_name = ?, last_name = ?, phone_number = ?, email = ?, sex = ?, status = ?
                 WHERE id = ? AND role = 'farmer'`,
                [first_name, last_name, phone_number, email, sex, status, id]
            );
            res.json({ success: true, message: 'Farmer updated successfully' });
        } catch (error) {
            console.error('Update farmer error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete Farmer
    async deleteFarmer(req, res) {
        try {
            await pool.query('DELETE FROM users WHERE id = ? AND role = ?', [req.params.id, 'farmer']);
            res.json({ success: true, message: 'Farmer deleted successfully' });
        } catch (error) {
            console.error('Delete farmer error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get user notifications
    async getNotifications(req, res) {
        try {
            const [notifications] = await pool.query(
                `SELECT n.*, p.title as post_title 
                 FROM notifications n
                 LEFT JOIN posts p ON n.post_id = p.id
                 WHERE n.user_id = ? 
                 ORDER BY n.created_at DESC 
                 LIMIT 50`,
                [req.user.id]
            );
            res.json({ success: true, data: notifications });
        } catch (error) {
            console.error('Fetch notifications error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Mark notification as read
    async markNotificationRead(req, res) {
        try {
            await pool.query(
                'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
                [req.params.id, req.user.id]
            );
            res.json({ success: true, message: 'Notification marked as read' });
        } catch (error) {
            console.error('Mark notification error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Contact admin (branch admin to super admin)
    async contactAdmin(req, res) {
        try {
            const { subject, message } = req.body;

            // Find super admin(s) to notify
            const [superAdmins] = await pool.query(
                "SELECT id FROM users WHERE role = 'super_admin'"
            );

            // Create notifications for all super admins
            for (const admin of superAdmins) {
                await pool.query(
                    'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                    [admin.id, `Message from Branch Admin: ${subject}`]
                );
            }

            res.json({ success: true, message: 'Message sent to administration' });
        } catch (error) {
            console.error('Contact admin error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // View user profile (admin view)
    async getUserProfile(req, res) {
        try {
            const [users] = await pool.query(
                `SELECT id, first_name, last_name, phone_number, email, sex, role, 
                        status, profile_photo, branch_id, created_at 
                 FROM users WHERE id = ?`,
                [req.params.id]
            );

            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            res.json({ success: true, user: users[0] });
        } catch (error) {
            console.error('Fetch user profile error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = userController;