-- =====================================================================
-- MOMO FOOD TRUCK LOYALTY CARD - POSTGRESQL INITIALIZATION SCRIPT
-- =====================================================================
-- Run this in your PostgreSQL terminal (psql) or pgAdmin Query Tool.
--
-- Step 1 (Optional, if creating a fresh database):
--   CREATE DATABASE momo_db;
--   \c momo_db;
-- =====================================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) DEFAULT '',
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Stamps Table (Stores only confirmed/approved stamps)
-- Pending claims stay in memory for 2 minutes and are only saved here when approved.
CREATE TABLE IF NOT EXISTS stamps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_stamps_user_id ON stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. Seed Initial Users (Passwords: 'admin123' and 'customer123')
INSERT INTO users (email, password_hash, name, role)
VALUES 
    ('admin@momo.com', '$2b$12$s06yKFwauKC8QDB0uqlWu.ZwGrdYP2nDsqNC9eesY7NyBWKnMlbXu', 'Chef Admin', 'admin'),
    ('customer@momo.com', '$2b$12$pfpIpqiCbtctpEoGQrYYFOBIvArZq3ZTQvbspucx25qhDj8VU47e6', 'Vishwash Joshi', 'user')
ON CONFLICT (email) DO NOTHING;
