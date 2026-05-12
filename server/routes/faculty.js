const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getProfile, getAssignedSubjects, getStudentsBySubject, markAttendance, uploadMarks, getAttendanceReport,
  createSubject, getAllStudents, enrollStudent, unenrollStudent, getEnrolledStudents, getMarksForSubject, deleteMark, getAttendanceForSubject
} = require('../controllers/facultyController');

router.use(authenticate);
router.use(authorize(['lecturer']));

router.get('/profile', getProfile);
router.get('/subjects', getAssignedSubjects);
router.get('/subjects/:id/students', getStudentsBySubject);
router.post('/attendance', markAttendance);
router.post('/marks', uploadMarks);
router.get('/attendance-report', getAttendanceReport);

router.post('/subjects', createSubject);
router.get('/all-students', getAllStudents);
router.post('/enroll-student', enrollStudent);
router.post('/unenroll-student', unenrollStudent);
router.get('/enrolled-students', getEnrolledStudents);
router.get('/marks-for-subject', getMarksForSubject);
router.delete('/marks/:id', deleteMark);
router.get('/attendance-for-subject', getAttendanceForSubject);

module.exports = router;
