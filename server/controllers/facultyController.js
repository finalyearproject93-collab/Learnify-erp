const pool = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT l.employee_id, l.full_name, l.department, l.phone, l.qualification, l.email
       FROM lecturers l JOIN users u ON l.user_id = u.id WHERE u.id = ?`,
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Lecturer not found' });
    res.json({ lecturer: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAssignedSubjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT sb.id, sb.subject_name, sb.semester, c.course_name, sa.academic_year
       FROM subject_assignments sa
       JOIN lecturers l ON sa.lecturer_id = l.id
       JOIN subjects sb ON sa.subject_id = sb.id
       JOIN courses c ON sb.course_id = c.id
       WHERE l.user_id = ?`,
      [userId]
    );
    res.json({ subjects: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStudentsBySubject = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT s.id, s.roll_number, s.full_name, s.department, s.semester,
              c.course_name
       FROM students s
       JOIN subject_enrollments se ON s.id = se.student_id
       LEFT JOIN courses c ON c.id = s.course_id
       WHERE se.subject_id = ?
       ORDER BY s.roll_number`,
      [id]
    );
    res.json({ students: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markAttendance = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { subject_id, date, attendance } = req.body;
    const userId = req.user.id;

    const [[lecturer]] = await connection.query('SELECT id FROM lecturers WHERE user_id = ?', [userId]);
    if (!lecturer) throw new Error('Lecturer not found');

    for (const record of attendance) {
      await connection.query(
        `INSERT INTO attendance (student_id, subject_id, date, status, marked_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [record.student_id, subject_id, date, record.status, lecturer.id]
      );
    }

    await connection.commit();
    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

const uploadMarks = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { subject_id, exam_type, marks } = req.body;
    const userId = req.user.id;

    const [[lecturer]] = await connection.query('SELECT id FROM lecturers WHERE user_id = ?', [userId]);
    if (!lecturer) throw new Error('Lecturer not found');

    for (const record of marks) {
      // Validate marks
      const marksObtained = parseFloat(record.marks_obtained);
      const maxMarks = parseFloat(record.max_marks) || 100;
      
      if (marksObtained < 0) {
        throw new Error(`Marks obtained cannot be negative for student ID ${record.student_id}`);
      }
      
      if (marksObtained > maxMarks) {
        throw new Error(`Marks obtained (${marksObtained}) cannot exceed max marks (${maxMarks}) for student ID ${record.student_id}`);
      }

      await connection.query(
        `INSERT INTO marks (student_id, subject_id, exam_type, marks_obtained, max_marks, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), max_marks = VALUES(max_marks)`,
        [record.student_id, subject_id, exam_type, marksObtained, maxMarks, lecturer.id]
      );
    }

    await connection.commit();
    res.json({ message: 'Marks uploaded successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const { subject_id } = req.query;
    const [rows] = await pool.query(
      `SELECT s.roll_number, s.full_name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(*) as total_classes,
        ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END) / NULLIF(COUNT(*), 0)) * 100, 2) as percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.subject_id = ?
       GROUP BY s.id, s.roll_number, s.full_name
       ORDER BY s.roll_number`,
      [subject_id]
    );
    res.json({ report: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { subject_name, course_id, semester, credits, subject_type } = req.body;
    const userId = req.user.id;

    const [[lecturer]] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [userId]);
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

    const [[countRow]] = await pool.query(
      'SELECT COUNT(*) as count FROM subjects WHERE course_id = ?',
      [course_id]
    );
    if (countRow.count >= 10) {
      return res.status(400).json({ message: 'Maximum 10 subjects allowed per course' });
    }

    const [result] = await pool.query(
      'INSERT INTO subjects (subject_name, course_id, semester, credits, subject_type) VALUES (?, ?, ?, ?, ?)',
      [subject_name, course_id, semester, credits, subject_type || 'theory']
    );

    await pool.query(
      'INSERT INTO subject_assignments (subject_id, lecturer_id, academic_year) VALUES (?, ?, ?)',
      [result.insertId, lecturer.id, new Date().getFullYear().toString()]
    );

    res.status(201).json({ message: 'Subject created and assigned', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.roll_number, s.full_name, s.department, s.semester,
              c.course_name
       FROM students s
       LEFT JOIN courses c ON c.id = s.course_id
       ORDER BY s.full_name`
    );
    res.json({ students: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const enrollStudent = async (req, res) => {
  try {
    const { subject_id, student_id } = req.body;
    const userId = req.user.id;

    const [[lecturer]] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [userId]);
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

    await pool.query(
      `INSERT INTO subject_enrollments (subject_id, student_id, enrolled_by) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE enrolled_by = VALUES(enrolled_by)`,
      [subject_id, student_id, lecturer.id]
    );

    res.json({ message: 'Student enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getEnrolledStudents = async (req, res) => {
  try {
    const { subject_id } = req.query;
    const [rows] = await pool.query(
      `SELECT s.id, s.roll_number, s.full_name, s.department, s.semester
       FROM subject_enrollments se
       JOIN students s ON se.student_id = s.id
       WHERE se.subject_id = ?`,
      [subject_id]
    );
    res.json({ students: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMarksForSubject = async (req, res) => {
  try {
    const { subject_id } = req.query;
    const [rows] = await pool.query(
      `SELECT m.id, m.student_id, m.exam_type, m.marks_obtained, m.max_marks,
        s.roll_number, s.full_name
       FROM marks m
       JOIN students s ON m.student_id = s.id
       WHERE m.subject_id = ?
       ORDER BY s.full_name, m.exam_type`,
      [subject_id]
    );
    res.json({ marks: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteMark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify the mark was uploaded by this lecturer
    const [[lecturer]] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [userId]);
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

    const [result] = await pool.query(
      'DELETE FROM marks WHERE id = ? AND uploaded_by = ?',
      [id, lecturer.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Mark not found or not authorized to delete' });
    }

    res.json({ message: 'Mark deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAttendanceForSubject = async (req, res) => {
  try {
    const { subject_id, date } = req.query;
    const [rows] = await pool.query(
      `SELECT a.id, a.student_id, a.status, s.roll_number, s.full_name
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.subject_id = ? AND a.date = ?`,
      [subject_id, date]
    );
    res.json({ attendance: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProfile, getAssignedSubjects, getStudentsBySubject, markAttendance, uploadMarks, getAttendanceReport,
  createSubject, getAllStudents, enrollStudent, getEnrolledStudents, getMarksForSubject, deleteMark, getAttendanceForSubject
};
