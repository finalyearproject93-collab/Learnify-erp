import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axios';
import { BookOpen, Users, UserCheck, Upload, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/faculty/subjects');
      setSubjects(response.data.subjects);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-pine-900">Welcome, {user?.full_name}!</h1>
        <p className="text-pine-500">Manage your classes and students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pine-500">Assigned Subjects</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{subjects.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pine-500">Quick Action</p>
              <p className="text-lg font-bold text-gray-900 mt-1">Mark Attendance</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-pine-600" />
            </div>
          </div>
          <Link to="/faculty/mark-attendance" className="mt-3 inline-block text-sm text-pine-600 hover:text-primary-700 font-medium">
            Go to Attendance &rarr;
          </Link>
        </div>

        <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pine-500">Quick Action</p>
              <p className="text-lg font-bold text-gray-900 mt-1">Upload Marks</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <Link to="/faculty/upload-marks" className="mt-3 inline-block text-sm text-pine-600 hover:text-primary-700 font-medium">
            Go to Marks &rarr;
          </Link>
        </div>
      </div>

      <div className="bg-cream border border-pine-100 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-pine-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-pine-600" />
          <h2 className="text-lg font-semibold text-pine-900">My Subjects</h2>
        </div>
        <table className="w-full">
          <thead style={{ backgroundColor: "#eeebd8" }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Semester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Academic Year</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pine-100">
            {subjects.map((subject, index) => (
              <tr key={index} className="hover:bg-pine-50">
                <td className="px-6 py-4 text-sm font-medium text-pine-900">{subject.subject_name}</td>
                <td className="px-6 py-4 text-sm text-pine-600">{subject.course_name}</td>
                <td className="px-6 py-4 text-sm text-pine-600">{subject.semester}</td>
                <td className="px-6 py-4 text-sm text-pine-600">{subject.academic_year}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {subjects.length === 0 && (
          <div className="text-center py-12 text-pine-500">No subjects assigned yet</div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;

