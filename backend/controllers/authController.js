const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { validationResult, body } = require('express-validator');

const registerValidation = [
  body('role').isIn(['student', 'lecturer', 'admin']).withMessage('Invalid role'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('roll_number').if(body('role').equals('student')).notEmpty().withMessage('Roll number is required for students'),
  body('employee_id').if(body('role').equals('lecturer')).notEmpty().withMessage('Employee ID is required for lecturers'),
  body('department').optional(),
  body('phone').optional(),
];

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, full_name, department, semester, phone, address, qualification, email } = req.body;
    let identifier, password;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      if (role === 'student') {
        const { roll_number } = req.body;
        const course_id = req.body.course_id;

        const rollRegex = /^E\d{2}\d{3}$/;
        if (!rollRegex.test(roll_number)) {
          return res.status(400).json({ message: 'Invalid roll number format. Use format: E + 2-digit year + 3-digit number (e.g., E26001)' });
        }

        if (!course_id) {
          return res.status(400).json({ message: 'Course is required for student registration' });
        }

        // Look up the course to get department name
        const [[course]] = await connection.query('SELECT course_name, department FROM courses WHERE id = ?', [parseInt(course_id)]);
        if (!course) {
          return res.status(400).json({ message: 'Selected course not found' });
        }

        const [existing] = await connection.query('SELECT id FROM students WHERE roll_number = ?', [roll_number]);
        if (existing.length > 0) {
          return res.status(400).json({ message: 'Roll number already exists' });
        }

        identifier = roll_number;
        password = roll_number;

        const hashedPassword = await bcrypt.hash(password, 10);
        const [userResult] = await connection.query(
          'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
          [email || `${roll_number}@learnify.edu`, hashedPassword, 'student']
        );
        const userId = userResult.insertId;

        await connection.query(
          'INSERT INTO students (user_id, roll_number, full_name, course_id, department, semester, year, phone, address, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, roll_number, full_name, parseInt(course_id), course.department || 'N/A', parseInt(semester) || 1, 1, null, null, email || `${roll_number}@learnify.edu`]
        );

        await connection.commit();
        return res.status(201).json({
          message: 'Student registered successfully',
          user: { id: userId, role: 'student', full_name, roll_number, password }
        });

      } else if (role === 'lecturer') {
        const { employee_id } = req.body;
        if (!employee_id) {
          return res.status(400).json({ message: 'Employee ID is required for faculty registration' });
        }

        const [existing] = await connection.query('SELECT id FROM lecturers WHERE employee_id = ?', [employee_id]);
        if (existing.length > 0) {
          return res.status(400).json({ message: 'Employee ID already exists' });
        }

        identifier = employee_id;
        password = employee_id;

        const hashedPassword = await bcrypt.hash(password, 10);
        const [userResult] = await connection.query(
          'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
          [email || `${employee_id}@learnify.edu`, hashedPassword, 'lecturer']
        );
        const userId = userResult.insertId;

        await connection.query(
          'INSERT INTO lecturers (user_id, employee_id, full_name, department, phone, qualification, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, employee_id, full_name, null, null, null, email || `${employee_id}@learnify.edu`]
        );

        await connection.commit();
        return res.status(201).json({
          message: 'Faculty registered successfully',
          user: { id: userId, role: 'lecturer', full_name, employee_id, password }
        });

      } else if (role === 'admin') {
        const { admin_id } = req.body;
        identifier = admin_id || email;
        password = req.body.password || 'admin123';

        const hashedPassword = await bcrypt.hash(password, 10);
        const [userResult] = await connection.query(
          'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
          [email || `${identifier}@learnify.edu`, hashedPassword, 'admin']
        );
        const userId = userResult.insertId;

        await connection.query(
          'INSERT INTO admins (user_id, full_name, phone, email) VALUES (?, ?, ?, ?)',
          [userId, full_name, phone || null, email || `${identifier}@learnify.edu`]
        );

        await connection.commit();
        return res.status(201).json({
          message: 'Admin registered successfully',
          user: { id: userId, role: 'admin', full_name, password }
        });
      }
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    // Return the actual DB error so it's visible during development
    res.status(500).json({ 
      message: error.message || 'Server error during registration',
      error: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    const { role, username, password } = req.body;

    if (!role || !username || !password) {
      return res.status(400).json({ message: 'Role, username, and password are required' });
    }

    let userQuery;
    let userData;

    if (role === 'student') {
      const [rows] = await pool.query(
        `SELECT u.id, u.password_hash, u.role, s.roll_number, s.full_name, s.department,
                s.semester, s.year, c.course_name
         FROM users u
         JOIN students s ON u.id = s.user_id
         LEFT JOIN courses c ON c.id = s.course_id
         WHERE s.roll_number = ? AND u.role = 'student'`,
        [username]
      );
      userData = rows[0];
    } else if (role === 'lecturer') {
      const [rows] = await pool.query(
        `SELECT u.id, u.password_hash, u.role, l.employee_id, l.full_name, l.department
         FROM users u JOIN lecturers l ON u.id = l.user_id WHERE l.employee_id = ? AND u.role = 'lecturer'`,
        [username]
      );
      userData = rows[0];
    } else if (role === 'admin') {
      const [rows] = await pool.query(
        `SELECT u.id, u.password_hash, u.role, a.full_name
         FROM users u JOIN admins a ON u.id = a.user_id WHERE (u.email = ? OR a.email = ?) AND u.role = 'admin'`,
        [username, username]
      );
      userData = rows[0];
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    if (!userData) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, userData.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokenPayload = {
      id: userData.id,
      role: userData.role,
      full_name: userData.full_name
    };

    const token = generateToken(tokenPayload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: {
        id: userData.id,
        role: userData.role,
        full_name: userData.full_name,
        department: userData.department,
        semester: userData.semester,
        year: userData.year,
        course_name: userData.course_name,
        roll_number: userData.roll_number,
        employee_id: userData.employee_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let userData;
    if (role === 'student') {
      const [rows] = await pool.query(
        `SELECT u.id, u.role, s.roll_number, s.full_name, s.department,
                s.semester, s.year, s.phone, s.address, s.email,
                c.course_name
         FROM users u
         JOIN students s ON u.id = s.user_id
         LEFT JOIN courses c ON c.id = s.course_id
         WHERE u.id = ?`,
        [userId]
      );
      userData = rows[0];
    } else if (role === 'lecturer') {
      const [rows] = await pool.query(
        `SELECT u.id, u.role, l.employee_id, l.full_name, l.department, l.phone, l.qualification, l.email
         FROM users u JOIN lecturers l ON u.id = l.user_id WHERE u.id = ?`,
        [userId]
      );
      userData = rows[0];
    } else if (role === 'admin') {
      const [rows] = await pool.query(
        `SELECT u.id, u.role, a.full_name, a.phone, a.email
         FROM users u JOIN admins a ON u.id = a.user_id WHERE u.id = ?`,
        [userId]
      );
      userData = rows[0];
    }

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: userData });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login, logout, getMe, registerValidation };
