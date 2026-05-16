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
      `SELECT n.id, n.title, n.message, n.target_role, n.created_at,
              COALESCE(l.full_name, 'System') as sender_name
       FROM notifications n
       LEFT JOIN users u ON n.created_by = u.id
       LEFT JOIN lecturers l ON u.id = l.user_id
       WHERE n.target_role IN ('all', 'student')
       ORDER BY n.created_at DESC
       LIMIT 20`
    );
    res.json({ notifications: rows || [] });
  } catch (error) {
    res.json({ notifications: [] });
  }
};

// Returns attendance data formatted for CSV download
const getAttendanceReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const [[student]] = await pool.query(
      `SELECT s.roll_number, s.full_name, c.course_name, s.semester
       FROM students s LEFT JOIN courses c ON c.id = s.course_id
       WHERE s.user_id = ?`, [userId]
    );
    const [rows] = await pool.query(
      `SELECT a.date, a.status, sb.subject_name
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN subjects sb ON a.subject_id = sb.id
       WHERE s.user_id = ?
       ORDER BY sb.subject_name, a.date DESC`,
      [userId]
    );

    // Build CSV
    const lines = [
      `Attendance Report - ${student?.full_name || ''} (${student?.roll_number || ''})`,
      `Course: ${student?.course_name || ''} | Semester: ${student?.semester || ''}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'Subject,Date,Status'
    ];
    rows.forEach(r => {
      lines.push(`"${r.subject_name}","${new Date(r.date).toLocaleDateString()}","${r.status}"`);
    });

    // Summary per subject
    const stats = rows.reduce((acc, r) => {
      if (!acc[r.subject_name]) acc[r.subject_name] = { present: 0, total: 0 };
      acc[r.subject_name].total++;
      if (r.status === 'present') acc[r.subject_name].present++;
      return acc;
    }, {});
    lines.push('', 'Subject,Present,Total,Percentage');
    Object.entries(stats).forEach(([sub, s]) => {
      lines.push(`"${sub}",${s.present},${s.total},${((s.present / s.total) * 100).toFixed(1)}%`);
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${student?.roll_number || 'report'}.csv"`);
    res.send(lines.join('\n'));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Returns marks data formatted for CSV download
const getMarksReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const [[student]] = await pool.query(
      `SELECT s.roll_number, s.full_name, c.course_name, s.semester
       FROM students s LEFT JOIN courses c ON c.id = s.course_id
       WHERE s.user_id = ?`, [userId]
    );
    const [rows] = await pool.query(
      `SELECT m.exam_type, m.marks_obtained, m.max_marks, sb.subject_name
       FROM marks m
       JOIN students s ON m.student_id = s.id
       JOIN subjects sb ON m.subject_id = sb.id
       WHERE s.user_id = ?
       ORDER BY sb.subject_name, m.exam_type`,
      [userId]
    );

    const lines = [
      `Marks Report - ${student?.full_name || ''} (${student?.roll_number || ''})`,
      `Course: ${student?.course_name || ''} | Semester: ${student?.semester || ''}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'Subject,Exam Type,Marks Obtained,Max Marks,Percentage,Result'
    ];
    rows.forEach(r => {
      const pct = ((r.marks_obtained / r.max_marks) * 100).toFixed(1);
      const result = parseFloat(pct) >= 50 ? 'Pass' : 'Fail';
      lines.push(`"${r.subject_name}","${r.exam_type}",${r.marks_obtained},${r.max_marks},${pct}%,${result}`);
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="marks_${student?.roll_number || 'report'}.csv"`);
    res.send(lines.join('\n'));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, getAttendance, getMarks, getNotifications, getAttendanceReport, getMarksReport };
