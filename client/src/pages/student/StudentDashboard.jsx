import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axios';
import { CalendarCheck, FileText, Bell, TrendingUp, Award, AlertTriangle, XCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [attRes, marksRes, notifRes] = await Promise.all([
        api.get('/student/attendance'),
        api.get('/student/marks'),
        api.get('/student/notifications')
      ]);
      setAttendance(attRes.data.attendance);
      setMarks(marksRes.data.marks);
      setNotifications(notifRes.data.notifications);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalClasses = attendance.length;
  const attendancePercent = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  const avgMarks = marks.length > 0
    ? Math.round(marks.reduce((sum, m) => sum + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length)
    : 0;

  // Count unique subjects from attendance
  const uniqueSubjects = [...new Set(attendance.map(a => a.subject_name))].length;

  // Per-subject stats for low attendance detection
  const subjectStats = attendance.reduce((acc, record) => {
    if (!acc[record.subject_name]) acc[record.subject_name] = { present: 0, total: 0 };
    acc[record.subject_name].total++;
    if (record.status === 'present') acc[record.subject_name].present++;
    return acc;
  }, {});

  const lowAttendanceSubjects = Object.entries(subjectStats).filter(
    ([, s]) => Math.round((s.present / s.total) * 100) < 75
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pine-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pine-800">Welcome, {user?.full_name}!</h1>
        <p className="text-pine-500">
          {user?.course_name || user?.department || 'Student'}
          {user?.year ? ` · Year ${user.year}` : ''}
          {user?.semester ? ` · Semester ${user.semester}` : ''}
        </p>
      </div>

      {/* Low attendance alert */}
      {lowAttendanceSubjects.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Low Attendance Warning</p>
              <p className="text-xs text-red-700 mt-0.5 mb-2">
                Your attendance is below 75% in {lowAttendanceSubjects.length} subject{lowAttendanceSubjects.length > 1 ? 's' : ''}.
                Improve attendance to avoid being barred from exams.
              </p>
              <div className="flex flex-wrap gap-2">
                {lowAttendanceSubjects.map(([subject, s]) => {
                  const pct = Math.round((s.present / s.total) * 100);
                  return (
                    <span key={subject} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 border border-red-200 rounded-full text-xs font-semibold text-red-800">
                      <XCircle className="w-3 h-3" />
                      {subject} — {pct}%
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pine-500">Attendance</p>
              <p className="text-3xl font-bold text-pine-900 mt-1">{attendancePercent}%</p>
              <p className="text-xs text-pine-400 mt-1">{presentCount}/{totalClasses} classes</p>
            </div>
            <div className="w-12 h-12 bg-pine-100 rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-6 h-6 text-pine-600" />
            </div>
          </div>
        </div>

        <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pine-500">Average Marks</p>
              <p className="text-3xl font-bold text-pine-900 mt-1">{avgMarks}%</p>
              <p className="text-xs text-pine-400 mt-1">Across all subjects</p>
            </div>
            <div className="w-12 h-12 bg-pine-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-pine-600" />
            </div>
          </div>
        </div>

        <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pine-500">Enrolled Subjects</p>
              <p className="text-3xl font-bold text-pine-900 mt-1">{uniqueSubjects}</p>
              <p className="text-xs text-pine-400 mt-1">Active subjects</p>
            </div>
            <div className="w-12 h-12 bg-pine-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-pine-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-pine-600" />
            <h2 className="text-lg font-semibold text-pine-800">Recent Marks</h2>
          </div>
          {marks.length > 0 ? (
            <div className="space-y-3">
              {marks.slice(0, 5).map((mark, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-pine-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-pine-900">{mark.subject_name}</p>
                    <p className="text-xs text-pine-500">{mark.exam_type}</p>
                  </div>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                    parseFloat(mark.marks_obtained) / parseFloat(mark.max_marks) >= 0.5
                      ? 'text-green-700 bg-green-100'
                      : 'text-red-700 bg-red-100'
                  }`}>
                    {mark.marks_obtained}/{mark.max_marks}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-pine-400 text-center py-8 text-sm">No marks available yet</p>
          )}
        </div>

        <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-pine-600" />
            <h2 className="text-lg font-semibold text-pine-800">Notifications</h2>
            {notifications.length > 0 && (
              <span className="ml-auto text-xs bg-pine-700 text-cream px-2 py-0.5 rounded-full font-semibold">
                {notifications.length}
              </span>
            )}
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {notifications.map((notif, index) => (
                <div key={index} className="p-3 bg-pine-50 border border-pine-200 rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-pine-900">{notif.title}</p>
                    <span className="text-xs text-pine-400 whitespace-nowrap flex-shrink-0">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-pine-700 leading-relaxed">{notif.message}</p>
                  {notif.sender_name && (
                    <p className="text-xs text-pine-400 mt-1.5">— {notif.sender_name}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-pine-400 text-center py-8 text-sm">No notifications yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
