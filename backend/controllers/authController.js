// Authentication controller with password hashing and JWT
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authController = {
    // Login user
    async login(req, res) {
        try {
            const { phone_number, password } = req.body;

            if (!phone_number || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Phone number and password are required' 
                });
            }

            // SQL Injection prevention using parameterized queries
            const [users] = await pool.query(
                'SELECT id, first_name, last_name, phone_number, password_hash, role, status, branch_id FROM users WHERE phone_number = ?',
                [phone_number]
            );

            if (users.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid phone number or password' 
                });
            }

            const user = users[0];

            if (user.status !== 'active') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Account is not active. Contact administrator.' 
                });
            }

            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid phone number or password' 
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    phone_number: user.phone_number, 
                    role: user.role,
                    branch_id: user.branch_id 
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    branch_id: user.branch_id
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    },

    // Register farmer (self-registration)
    async registerFarmer(req, res) {
        try {
            const { first_name, last_name, phone_number, password, sex } = req.body;

            // Check if user already exists
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE phone_number = ?',
                [phone_number]
            );

            if (existing.length > 0) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'Account with this phone number already exists' 
                });
            }

            // Hash password
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Insert new farmer
            const [result] = await pool.query(
                'INSERT INTO users (first_name, last_name, phone_number, password_hash, sex, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [first_name, last_name, phone_number, password_hash, sex, 'farmer', 'active']
            );

            res.status(201).json({
                success: true,
                message: 'Account created successfully. You can now login.',
                user_id: result.insertId
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    },

    // Register user (admin/branch admin only)
    async registerUser(req, res) {
        try {
            const { first_name, last_name, phone_number, password, sex, role, branch_id } = req.body;

            // Validate creator permissions
            if (req.user.role === 'super_admin' && !['branch_admin'].includes(role)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Super admin can only create branch admins' 
                });
            }
            if (req.user.role === 'branch_admin' && !['da', 'sms'].includes(role)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Branch admin can only create DAs and SMSs' 
                });
            }

            // Check if user exists
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE phone_number = ?',
                [phone_number]
            );

            if (existing.length > 0) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'Account with this phone number already exists' 
                });
            }

            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            const [result] = await pool.query(
                'INSERT INTO users (first_name, last_name, phone_number, password_hash, sex, role, branch_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [first_name, last_name, phone_number, password_hash, sex, role, branch_id, req.user.id]
            );

            res.status(201).json({
                success: true,
                message: `${role} account created successfully`,
                user_id: result.insertId
            });
        } catch (error) {
            console.error('User creation error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    },

    // Get user profile
    async getProfile(req, res) {
        try {
            const [users] = await pool.query(
                'SELECT id, first_name, last_name, phone_number, email, sex, role, status, profile_photo, created_at FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            res.json({ success: true, user: users[0] });
        } catch (error) {
            console.error('Profile fetch error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    },

    // Update profile
    async updateProfile(req, res) {
        try {
            const { first_name, last_name, email } = req.body;
            
            await pool.query(
                'UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
                [first_name, last_name, email, req.user.id]
            );

            res.json({ 
                success: true, 
                message: 'Profile updated successfully' 
            });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }
};

module.exports = authController;