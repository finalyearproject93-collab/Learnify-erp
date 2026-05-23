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

    // Only return subjects explicitly assigned to this lecturer via subject_assignments
    const [rows] = await pool.query(
      `SELECT sb.id, sb.subject_name, sb.semester, c.course_name, c.id as course_id, sa.academic_year
       FROM subject_assignments sa
       JOIN lecturers l ON sa.lecturer_id = l.id
       JOIN subjects sb ON sa.subject_id = sb.id
       JOIN courses c ON sb.course_id = c.id
       WHERE l.user_id = ?
       ORDER BY sb.semester, sb.subject_name`,
      [userId]
    );
    res.json({ subjects: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Returns the course assigned to this lecturer (from lecturers.course_id)
// Falls back to courses derived from subject_assignments if no direct course set
const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    // First try: lecturer's directly assigned course
    const [[lecturer]] = await pool.query(
      'SELECT course_id FROM lecturers WHERE user_id = ?', [userId]
    );

    if (lecturer?.course_id) {
      const [rows] = await pool.query(
        'SELECT id, course_name, department FROM courses WHERE id = ?',
        [lecturer.course_id]
      );
      return res.json({ courses: rows });
    }

    // Fallback: courses from subject_assignments
    const [rows] = await pool.query(
      `SELECT DISTINCT c.id, c.course_name, c.department
       FROM subject_assignments sa
       JOIN lecturers l ON sa.lecturer_id = l.id
       JOIN subjects sb ON sa.subject_id = sb.id
       JOIN courses c ON sb.course_id = c.id
       WHERE l.user_id = ?
       ORDER BY c.course_name`,
      [userId]
    );
    res.json({ courses: rows });
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
    const { subject_id, from_date, to_date } = req.query;

    let query, params;

    if (from_date && to_date) {
      // Date-filtered summary
      query = `SELECT s.roll_number, s.full_name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(*) as total_classes,
        ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END) / NULLIF(COUNT(*), 0)) * 100, 2) as percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.subject_id = ? AND a.date BETWEEN ? AND ?
       GROUP BY s.id, s.roll_number, s.full_name
       ORDER BY s.roll_number`;
      params = [subject_id, from_date, to_date];
    } else {
      query = `SELECT s.roll_number, s.full_name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(*) as total_classes,
        ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END) / NULLIF(COUNT(*), 0)) * 100, 2) as percentage
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.subject_id = ?
       GROUP BY s.id, s.roll_number, s.full_name
       ORDER BY s.roll_number`;
      params = [subject_id];
    }

    const [rows] = await pool.query(query, params);
    res.json({ report: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Date-wise detailed attendance for a subject (for PDF download)
const getAttendanceDatewise = async (req, res) => {
  try {
    const { subject_id, from_date, to_date } = req.query;

    let whereClause = 'WHERE a.subject_id = ?';
    const params = [subject_id];

    if (from_date && to_date) {
      whereClause += ' AND a.date BETWEEN ? AND ?';
      params.push(from_date, to_date);
    }

    const [rows] = await pool.query(
      `SELECT s.roll_number, s.full_name, a.date, a.status
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       ${whereClause}
       ORDER BY a.date ASC, s.roll_number ASC`,
      params
    );

    // Also get subject info
    const [[subject]] = await pool.query(
      `SELECT sb.subject_name, c.course_name FROM subjects sb
       JOIN courses c ON c.id = sb.course_id WHERE sb.id = ?`,
      [subject_id]
    );

    res.json({ records: rows, subject });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Marks report for a subject (for PDF download)
const getMarksReport = async (req, res) => {
  try {
    const { subject_id } = req.query;

    const [rows] = await pool.query(
      `SELECT s.roll_number, s.full_name, m.exam_type, m.marks_obtained, m.max_marks
       FROM marks m
       JOIN students s ON m.student_id = s.id
       WHERE m.subject_id = ?
       ORDER BY s.roll_number, m.exam_type`,
      [subject_id]
    );

    const [[subject]] = await pool.query(
      `SELECT sb.subject_name, c.course_name FROM subjects sb
       JOIN courses c ON c.id = sb.course_id WHERE sb.id = ?`,
      [subject_id]
    );

    res.json({ records: rows, subject });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const assignSubjectToLecturer = async (req, res) => {
  try {
    const { subject_id } = req.body;
    const userId = req.user.id;

    const [[lecturer]] = await pool.query('SELECT id, course_id FROM lecturers WHERE user_id = ?', [userId]);
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

    // Verify the subject belongs to the faculty's course
    const [[subject]] = await pool.query('SELECT id, course_id FROM subjects WHERE id = ?', [parseInt(subject_id)]);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    if (lecturer.course_id && subject.course_id !== lecturer.course_id) {
      return res.status(403).json({ message: 'This subject does not belong to your assigned course' });
    }

    // Check if already assigned
    const [[existing]] = await pool.query(
      'SELECT id FROM subject_assignments WHERE subject_id = ? AND lecturer_id = ?',
      [subject_id, lecturer.id]
    );
    if (existing) {
      return res.status(400).json({ message: 'You have already added this subject' });
    }

    await pool.query(
      'INSERT INTO subject_assignments (subject_id, lecturer_id, academic_year) VALUES (?, ?, ?)',
      [subject_id, lecturer.id, new Date().getFullYear().toString()]
    );

    res.status(201).json({ message: 'Subject assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Returns subjects in the faculty's course that are NOT yet assigned to them
const getAvailableSubjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const [[lecturer]] = await pool.query(
      'SELECT id, course_id FROM lecturers WHERE user_id = ?', [userId]
    );
    if (!lecturer || !lecturer.course_id) return res.json({ subjects: [] });

    const [rows] = await pool.query(
      `SELECT sb.id, sb.subject_name, sb.semester, sb.credits, sb.subject_type, c.course_name
       FROM subjects sb
       JOIN courses c ON c.id = sb.course_id
       WHERE sb.course_id = ?
         AND sb.id NOT IN (
           SELECT subject_id FROM subject_assignments WHERE lecturer_id = ?
         )
       ORDER BY sb.semester, sb.subject_name`,
      [lecturer.course_id, lecturer.id]
    );
    res.json({ subjects: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    // If subject_id is provided, filter students by the subject's course
    const { subject_id } = req.query;

    if (subject_id) {
      // Get the course_id of the subject first
      const [[subject]] = await pool.query(
        'SELECT course_id FROM subjects WHERE id = ?',
        [parseInt(subject_id)]
      );
      if (!subject) return res.status(404).json({ message: 'Subject not found' });

      const [rows] = await pool.query(
        `SELECT s.id, s.roll_number, s.full_name, s.department, s.semester,
                c.course_name
         FROM students s
         LEFT JOIN courses c ON c.id = s.course_id
         WHERE s.course_id = ?
         ORDER BY s.roll_number`,
        [subject.course_id]
      );
      return res.json({ students: rows });
    }

    // No filter — return all (used elsewhere)
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

const unenrollStudent = async (req, res) => {
  try {
    const { subject_id, student_id } = req.body;
    const userId = req.user.id;

    const [[lecturer]] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [userId]);
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

    const [result] = await pool.query(
      'DELETE FROM subject_enrollments WHERE subject_id = ? AND student_id = ?',
      [subject_id, student_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json({ message: 'Student unenrolled successfully' });
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
      `SELECT s.id, s.roll_number, s.full_name, s.department, s.semester,
              c.course_name
       FROM subject_enrollments se
       JOIN students s ON se.student_id = s.id
       LEFT JOIN courses c ON c.id = s.course_id
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

const sendNotification = async (req, res) => {
  try {
    const { title, message, target_role } = req.body;
    const userId = req.user.id;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    await pool.query(
      `INSERT INTO notifications (title, message, target_role, created_by)
       VALUES (?, ?, ?, ?)`,
      [title, message, target_role || 'student', userId]
    );

    res.status(201).json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.message, n.target_role, n.created_at
       FROM notifications n
       WHERE n.created_by = ?
       ORDER BY n.created_at DESC
       LIMIT 20`,
      [userId]
    );
    res.json({ notifications: rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProfile, getAssignedSubjects, getMyCourses, getAvailableSubjects,
  getStudentsBySubject, markAttendance, uploadMarks, getAttendanceReport,
  assignSubjectToLecturer, getAllStudents, enrollStudent, unenrollStudent,
  getEnrolledStudents, getMarksForSubject, deleteMark,
  getAttendanceForSubject, sendNotification, getMyNotifications,
  getAttendanceDatewise, getMarksReport
};
