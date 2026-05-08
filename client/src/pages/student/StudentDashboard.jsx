import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axios';
import { CalendarCheck, FileText, Bell, TrendingUp, Award } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.full_name}!</h1>
        <p className="text-gray-500">
          {user?.course_name || user?.department || 'Student'}
          {user?.year ? ` · Year ${user.year}` : ''}
          {user?.semester ? ` · Semester ${user.semester}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Attendance</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{attendancePercent}%</p>
              <p className="text-xs text-gray-400 mt-1">{presentCount}/{totalClasses} classes</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Marks</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{avgMarks}%</p>
              <p className="text-xs text-gray-400 mt-1">Across all subjects</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Enrolled Subjects</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{uniqueSubjects}</p>
              <p className="text-xs text-gray-400 mt-1">Active subjects</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Marks</h2>
          </div>
          {marks.length > 0 ? (
            <div className="space-y-3">
              {marks.slice(0, 5).map((mark, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{mark.subject_name}</p>
                    <p className="text-xs text-gray-500">{mark.exam_type}</p>
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
            <p className="text-gray-500 text-center py-8">No marks available yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <div key={index} className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No notifications</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
