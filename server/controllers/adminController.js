const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const getDashboardStats = async (req, res) => {
  try {
    const [[studentCount]] = await pool.query('SELECT COUNT(*) as count FROM students');
    const [[lecturerCount]] = await pool.query('SELECT COUNT(*) as count FROM lecturers');
    const [[courseCount]] = await pool.query('SELECT COUNT(*) as count FROM courses');
    const [[subjectCount]] = await pool.query('SELECT COUNT(*) as count FROM subjects');

    res.json({
      students: studentCount.count,
      lecturers: lecturerCount.count,
      courses: courseCount.count,
      subjects: subjectCount.count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [students] = await pool.query(
      `SELECT u.id, s.roll_number, s.full_name, s.semester, s.phone, s.email,
              c.course_name, 'student' as role
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN courses c ON c.id = s.course_id`
    );
    const [lecturers] = await pool.query(
      `SELECT u.id, l.employee_id, l.full_name, l.phone, l.email, 'lecturer' as role
       FROM users u JOIN lecturers l ON u.id = l.user_id`
    );
    const [admins] = await pool.query(
      `SELECT u.id, a.full_name, a.phone, a.email, 'admin' as role
       FROM users u JOIN admins a ON u.id = a.user_id`
    );

    res.json({ users: [...students, ...lecturers, ...admins] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createUser = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { role, full_name, department, phone, email } = req.body;
    let identifier, password;

    if (role === 'student') {
      const { roll_number, semester, address, course_id } = req.body;
      identifier = roll_number;
      password = roll_number;
      const hashed = await bcrypt.hash(password, 10);

      // Get department from course
      let dept = 'N/A';
      if (course_id) {
        const [[course]] = await connection.query('SELECT department FROM courses WHERE id = ?', [parseInt(course_id)]);
        if (course) dept = course.department;
      }

      const studentEmail = email || `${roll_number}@learnify.edu`;
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [studentEmail, hashed, 'student']
      );
      await connection.query(
        'INSERT INTO students (user_id, roll_number, full_name, course_id, department, semester, year, phone, address, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userResult.insertId, roll_number, full_name, course_id ? parseInt(course_id) : null, dept, parseInt(semester) || 1, 1, phone || null, address || null, studentEmail]
      );
    } else if (role === 'lecturer') {
      const { employee_id } = req.body;
      identifier = employee_id;
      password = employee_id;
      const hashed = await bcrypt.hash(password, 10);
      const lecturerEmail = email || `${employee_id}@learnify.edu`;
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [lecturerEmail, hashed, 'lecturer']
      );
      await connection.query(
        'INSERT INTO lecturers (user_id, employee_id, full_name, department, phone, qualification, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userResult.insertId, employee_id, full_name, null, null, null, lecturerEmail]
      );
    } else if (role === 'admin') {
      identifier = email;
      password = req.body.password || 'admin123';
      const hashed = await bcrypt.hash(password, 10);
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [email, hashed, 'admin']
      );
      await connection.query(
        'INSERT INTO admins (user_id, full_name, phone, email) VALUES (?, ?, ?, ?)',
        [userResult.insertId, full_name, phone || null, email]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'User created successfully', password });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, semester, course_id, email, phone } = req.body;

    // Find the user's role first
    const [[user]] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'student') {
      // Derive department from course if course_id changed
      let dept = null;
      if (course_id) {
        const [[course]] = await pool.query('SELECT department FROM courses WHERE id = ?', [parseInt(course_id)]);
        if (course) dept = course.department;
      }

      await pool.query(
        `UPDATE students SET
          full_name   = COALESCE(?, full_name),
          semester    = COALESCE(?, semester),
          course_id   = COALESCE(?, course_id),
          department  = COALESCE(?, department),
          email       = COALESCE(?, email),
          phone       = COALESCE(?, phone)
         WHERE user_id = ?`,
        [full_name || null, semester ? parseInt(semester) : null,
         course_id ? parseInt(course_id) : null, dept,
         email || null, phone || null, id]
      );
    } else if (user.role === 'lecturer') {
      await pool.query(
        `UPDATE lecturers SET
          full_name = COALESCE(?, full_name),
          email     = COALESCE(?, email),
          phone     = COALESCE(?, phone)
         WHERE user_id = ?`,
        [full_name || null, email || null, phone || null, id]
      );
    } else if (user.role === 'admin') {
      await pool.query(
        `UPDATE admins SET
          full_name = COALESCE(?, full_name),
          email     = COALESCE(?, email),
          phone     = COALESCE(?, phone)
         WHERE user_id = ?`,
        [full_name || null, email || null, phone || null, id]
      );
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAttendanceStats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.department,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
        COUNT(*) as total
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       GROUP BY s.department`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMarksStats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        SUM(CASE WHEN (m.marks_obtained/m.max_marks)*100 >= 90 THEN 1 ELSE 0 END) as A,
        SUM(CASE WHEN (m.marks_obtained/m.max_marks)*100 >= 80 AND (m.marks_obtained/m.max_marks)*100 < 90 THEN 1 ELSE 0 END) as B,
        SUM(CASE WHEN (m.marks_obtained/m.max_marks)*100 >= 70 AND (m.marks_obtained/m.max_marks)*100 < 80 THEN 1 ELSE 0 END) as C,
        SUM(CASE WHEN (m.marks_obtained/m.max_marks)*100 >= 60 AND (m.marks_obtained/m.max_marks)*100 < 70 THEN 1 ELSE 0 END) as D,
        SUM(CASE WHEN (m.marks_obtained/m.max_marks)*100 < 60 THEN 1 ELSE 0 END) as F
       FROM marks m`
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCourses = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM courses ORDER BY course_name');
    res.json({ courses: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { course_name, department, duration_years } = req.body;
    const [result] = await pool.query(
      'INSERT INTO courses (course_name, department, duration_years) VALUES (?, ?, ?)',
      [course_name, department, duration_years]
    );
    res.status(201).json({ message: 'Course created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSubjects = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, c.course_name FROM subjects s JOIN courses c ON s.course_id = c.id ORDER BY s.subject_name`
    );
    res.json({ subjects: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { subject_name, course_id, semester, credits, subject_type } = req.body;

    if (!subject_name || !course_id || !semester || !credits) {
      return res.status(400).json({ message: 'Subject name, course, semester and credits are required' });
    }

    const cid = parseInt(course_id);
    const sem = parseInt(semester);
    const cred = parseInt(credits);

    const [[countRow]] = await pool.query(
      'SELECT COUNT(*) as count FROM subjects WHERE course_id = ?',
      [cid]
    );
    if (countRow.count >= 10) {
      return res.status(400).json({ message: 'Maximum 10 subjects allowed per course' });
    }

    const [result] = await pool.query(
      'INSERT INTO subjects (subject_name, course_id, semester, credits, subject_type) VALUES (?, ?, ?, ?, ?)',
      [subject_name, cid, sem, cred, subject_type || 'theory']
    );
    res.status(201).json({ message: 'Subject created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM subjects WHERE id = ?', [id]);
    res.json({ message: 'Subject deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDashboardStats, getAllUsers, createUser, updateUser, deleteUser,
  getAttendanceStats, getMarksStats,
  getCourses, createCourse, deleteCourse, getSubjects, createSubject, deleteSubject
};
