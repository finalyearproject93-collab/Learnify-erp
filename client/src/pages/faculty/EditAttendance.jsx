import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { CalendarCheck, CheckCircle, XCircle, Save } from 'lucide-react';

const EditAttendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/faculty/subjects');
      setSubjects(response.data.subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchStudents = async (subjectId) => {
    try {
      const response = await api.get(`/faculty/subjects/${subjectId}/students`);
      setStudents(response.data.students);
      return response.data.students;
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  };

  const fetchAttendanceForDate = async (subjectId, selectedDate, studentList) => {
    try {
      const response = await api.get(`/faculty/attendance-for-subject?subject_id=${subjectId}&date=${selectedDate}`);
      const existing = response.data.attendance;
      const merged = {};
      studentList.forEach(s => {
        const record = existing.find(a => a.student_id === s.id);
        merged[s.id] = record ? record.status : 'present';
      });
      setAttendance(merged);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      const fallback = {};
      studentList.forEach(s => { fallback[s.id] = 'present'; });
      setAttendance(fallback);
    }
  };

  const handleSubjectChange = async (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setMessage('');
    if (subjectId) {
      const studentList = await fetchStudents(subjectId);
      if (studentList.length > 0) {
        await fetchAttendanceForDate(subjectId, date, studentList);
      }
    } else {
      setStudents([]);
      setAttendance({});
    }
  };

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    setMessage('');
    if (selectedSubject && students.length > 0) {
      await fetchAttendanceForDate(selectedSubject, newDate, students);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status
      }));
      await api.post('/faculty/attendance', {
        subject_id: parseInt(selectedSubject),
        date,
        attendance: attendanceData
      });
      setMessage('Attendance updated successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Attendance</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select value={selectedSubject} onChange={handleSubjectChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_name} ({s.course_name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={handleDateChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.includes('success') ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {message}
          </div>
        )}

        {selectedSubject && students.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex gap-6">
                <span className="text-sm text-gray-600">Total: <strong>{students.length}</strong></span>
                <span className="text-sm text-green-600">Present: <strong>{presentCount}</strong></span>
                <span className="text-sm text-red-600">Absent: <strong>{absentCount}</strong></span>
              </div>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{student.roll_number}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.course_name || student.department || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleAttendance(student.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          attendance[student.id] === 'present'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}>
                        {attendance[student.id] === 'present' ? (
                          <><CheckCircle className="w-4 h-4" /> Present</>
                        ) : (
                          <><XCircle className="w-4 h-4" /> Absent</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={handleSubmit} disabled={loading}
              className="mt-6 w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <><Save className="w-4 h-4" /> Save Attendance</>
              )}
            </button>
          </>
        )}

        {selectedSubject && students.length === 0 && (
          <div className="text-center py-12 text-gray-500">No students found for this subject</div>
        )}
      </div>
    </div>
  );
};

export default EditAttendance;
