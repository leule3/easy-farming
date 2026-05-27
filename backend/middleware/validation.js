// Input validation middleware
const validateRegistration = (req, res, next) => {
    const { first_name, last_name, phone_number, password, sex, role } = req.body;
    const errors = [];

    if (!first_name || first_name.length < 2) {
        errors.push('First name must be at least 2 characters');
    }
    if (!last_name || last_name.length < 2) {
        errors.push('Last name must be at least 2 characters');
    }
    if (!phone_number || !/^09\d{8}$/.test(phone_number)) {
        errors.push('Valid Ethiopian phone number required (09XXXXXXXX)');
    }
    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    if (!['Male', 'Female', 'Other'].includes(sex)) {
        errors.push('Invalid sex value');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    next();
};

// XSS Prevention - Sanitize input
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                // Basic XSS prevention
                req.body[key] = req.body[key]
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;');
            }
        });
    }
    next();
};

module.exports = { validateRegistration, sanitizeInput };