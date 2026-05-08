import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { CalendarCheck, CheckCircle, XCircle } from 'lucide-react';

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/student/attendance');
      setAttendance(response.data.attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const subjectStats = attendance.reduce((acc, record) => {
    if (!acc[record.subject_name]) {
      acc[record.subject_name] = { present: 0, total: 0 };
    }
    acc[record.subject_name].total++;
    if (record.status === 'present') acc[record.subject_name].present++;
    return acc;
  }, {});

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
        <h1 className="text-2xl font-bold text-gray-900">Attendance Record</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(subjectStats).map(([subject, stats]) => {
          const percent = Math.round((stats.present / stats.total) * 100);
          return (
            <div key={subject} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm font-medium text-gray-900">{subject}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{stats.present}/{stats.total}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Attendance Details</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attendance.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{record.subject_name}</td>
                <td className="px-6 py-4">
                  {record.status === 'present' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3" /> Present
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <XCircle className="w-3 h-3" /> Absent
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendance.length === 0 && (
          <div className="text-center py-12 text-gray-500">No attendance records found</div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
