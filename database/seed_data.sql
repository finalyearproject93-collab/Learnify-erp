-- Learnify Seed Data
-- Run this after creating the database schema

USE learnify;

-- Insert sample courses
INSERT INTO courses (course_name, department, duration_years) VALUES
('BCA', 'Computer Science', 3),
('BCOM', 'Commerce', 3),
('BSC', 'Science', 3),
('BBA', 'Commerce',3),
('BA', 'Arts', 3);

-- Insert sample subjects (mix of theory and lab)
INSERT INTO subjects (subject_name, course_id, semester, credits, subject_type) VALUES
('Data Structures', 1, 3, 4, 'theory'),
('Data Structures Lab', 1, 3, 2, 'lab'),
('Algorithms', 1, 4, 4, 'theory'),
('Algorithms Lab', 1, 4, 2, 'lab'),
('Database Systems', 1, 5, 4, 'theory'),
('Database Lab', 1, 5, 2, 'lab'),
('Digital Electronics', 2, 3, 3, 'theory'),
('Digital Electronics Lab', 2, 3, 2, 'lab'),
('Signals and Systems', 2, 4, 4, 'theory'),
('Signals Lab', 2, 4, 2, 'lab');

-- Insert sample admin (password: admin123)
-- Note: In production, use bcrypt hashed password. This is for testing only.
INSERT INTO users (email, password_hash, role) VALUES
('admin@learnify.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

INSERT INTO admins (user_id, full_name, phone, email) VALUES
(1, 'System Administrator', '9876543210', 'admin@learnify.edu');

-- Test Credentials:
-- Admin: admin@learnify.edu / admin123
-- Student: E26001 / E26001 (after registering)
-- Faculty: EMP001 / EMP001 (after registering)
