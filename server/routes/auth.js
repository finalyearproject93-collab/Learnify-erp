const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, registerValidation } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', registerValidation, register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

// Public endpoint — used by register page before login
router.get('/courses', async (req, res) => {
  try {
    const pool = require('../config/db');
    const [rows] = await pool.query('SELECT id, course_name, department FROM courses ORDER BY course_name');
    res.json({ courses: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
