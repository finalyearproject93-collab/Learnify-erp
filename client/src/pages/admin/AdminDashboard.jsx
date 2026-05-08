import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { Users, BookOpen, GraduationCap, Award, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, lecturers: 0, courses: 0, subjects: 0 });
  const [attendanceData, setAttendanceData] = useState([]);
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, attendanceRes, marksRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/attendance-stats'),
        api.get('/admin/marks-stats')
      ]);

      setStats(statsRes.data);

      const attData = attendanceRes.data.map(d => ({
        department: d.department,
        percentage: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0
      }));
      setAttendanceData(attData);

      const mData = marksRes.data;
      setMarksData([
        { name: 'A (90-100%)', value: Number(mData.A) || 0, color: '#22c55e' },
        { name: 'B (80-89%)', value: Number(mData.B) || 0, color: '#3b82f6' },
        { name: 'C (70-79%)', value: Number(mData.C) || 0, color: '#f59e0b' },
        { name: 'D (60-69%)', value: Number(mData.D) || 0, color: '#f97316' },
        { name: 'F (<60%)', value: Number(mData.F) || 0, color: '#ef4444' }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Students', value: stats.students, icon: GraduationCap, color: 'bg-green-100 text-green-600' },
    { label: 'Faculty', value: stats.lecturers, icon: Users, color: 'bg-orange-100 text-orange-600' },
    { label: 'Courses', value: stats.courses, icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
    { label: 'Subjects', value: stats.subjects, icon: Award, color: 'bg-purple-100 text-purple-600' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <span className="text-sm text-gray-500">Overview of college activities</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Attendance by Department</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Marks Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={marksData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {marksData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {marksData.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
