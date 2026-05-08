const pool = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT s.roll_number, s.full_name, s.department, s.semester, s.year, s.phone, s.address, s.email,
              c.course_name, c.id as course_id
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN courses c ON c.id = s.course_id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ student: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT a.date, a.status, sb.subject_name
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN subjects sb ON a.subject_id = sb.id
       WHERE s.user_id = ?
       ORDER BY a.date DESC`,
      [userId]
    );
    res.json({ attendance: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT m.exam_type, m.marks_obtained, m.max_marks, sb.subject_name
       FROM marks m
       JOIN students s ON m.student_id = s.id
       JOIN subjects sb ON m.subject_id = sb.id
       WHERE s.user_id = ?
       ORDER BY sb.subject_name, m.exam_type`,
      [userId]
    );
    res.json({ marks: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE target_role IN ('all', 'student') ORDER BY created_at DESC LIMIT 10`
    );
    res.json({ notifications: rows || [] });
  } catch (error) {
    // Return empty array if notifications table doesn't exist yet
    res.json({ notifications: [] });
  }
};

module.exports = { getProfile, getAttendance, getMarks, getNotifications };
