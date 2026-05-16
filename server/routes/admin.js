const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getDashboardStats, getAllUsers, createUser, updateUser, deleteUser,
  getAttendanceStats, getMarksStats,
  getCourses, createCourse, updateCourse, deleteCourse,
  getSubjects, createSubject, updateSubject, deleteSubject
} = require('../controllers/adminController');

router.use(authenticate);

// Courses endpoint accessible to both admin and lecturer
router.get('/courses', authorize(['admin', 'lecturer']), getCourses);

// Admin-only routes
router.use(authorize(['admin']));

router.get('/dashboard-stats', getDashboardStats);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/attendance-stats', getAttendanceStats);
router.get('/marks-stats', getMarksStats);

router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

module.exports = router;
