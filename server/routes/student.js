const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getProfile,
  getAttendance,
  getMarks,
  getNotifications,
  getAttendanceReport,
  getMarksReport
} = require('../controllers/studentController');

router.use(authenticate);
router.use(authorize(['student']));

router.get('/profile', getProfile);
router.get('/attendance', getAttendance);
router.get('/marks', getMarks);
router.get('/notifications', getNotifications);
router.get('/download/attendance', getAttendanceReport);
router.get('/download/marks', getMarksReport);

module.exports = router;
