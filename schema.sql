-- ============================================
-- EASY FARMING - FIXED DATABASE SCHEMA
-- ============================================

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS innovations;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS problem_reports;
DROP TABLE IF EXISTS forum_replies;
DROP TABLE IF EXISTS forum_discussions;
DROP TABLE IF EXISTS private_comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS branches;

-- ============================================
-- Create branches table FIRST (no foreign keys yet)
-- ============================================
CREATE TABLE branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch_name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    woreda VARCHAR(100),
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Create users table (NO foreign keys initially)
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    sex ENUM('Male', 'Female', 'Other') NOT NULL,
    role ENUM('super_admin', 'branch_admin', 'da', 'sms', 'farmer') NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    profile_photo VARCHAR(255) DEFAULT NULL,
    branch_id INT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- NOW add foreign keys using ALTER TABLE
-- ============================================

-- Add foreign key from users.branch_id to branches.id
ALTER TABLE users
ADD CONSTRAINT fk_users_branch
FOREIGN KEY (branch_id) REFERENCES branches(id)
ON DELETE SET NULL;

-- Add foreign key from branches.created_by to users.id
ALTER TABLE branches
ADD CONSTRAINT fk_branches_created_by
FOREIGN KEY (created_by) REFERENCES users(id)
ON DELETE SET NULL;

-- Add foreign key from users.created_by to users.id
ALTER TABLE users
ADD CONSTRAINT fk_users_created_by
FOREIGN KEY (created_by) REFERENCES users(id)
ON DELETE SET NULL;

-- ============================================
-- Create remaining tables
-- ============================================

CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    post_type ENUM('information', 'warning') DEFAULT 'information',
    warning_type ENUM('flood', 'wildfire', 'locust_swarm', 'general') DEFAULT NULL,
    created_by INT NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE private_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE forum_discussions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE forum_replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    discussion_id INT NOT NULL,
    user_id INT NOT NULL,
    reply TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discussion_id) REFERENCES forum_discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE problem_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    is_prioritized TINYINT(1) DEFAULT 0,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE innovations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT DEFAULT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Insert default Super Admin
-- Password: admin123 (bcrypt hashed)
-- ============================================
INSERT INTO users (first_name, last_name, phone_number, email, password_hash, sex, role, status) 
VALUES ('System', 'Administrator', '0911111111', 'admin@easyfarming.et', 
        '$2b$10$ZMPiAepxOCyJsMoaHT4iIOwGshdnMTs7a89WLPu9Zd1bQmZSFajFG', 
        'Male', 'super_admin', 'active');

-- ============================================
-- Verification
-- ============================================
SELECT '========================================' AS '';
SELECT 'DATABASE SETUP COMPLETE!' AS status;
SELECT '========================================' AS '';
SELECT 'Tables created:' AS '';
SHOW TABLES;
SELECT '' AS '';
SELECT 'Default Login Credentials:' AS '';
SELECT 'Phone: 0911111111' AS '';
SELECT 'Password: admin123' AS '';