import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { UserCheck, CheckCircle, XCircle, Save } from 'lucide-react';

const MarkAttendance = () => {
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
      const initialAttendance = {};
      response.data.students.forEach(s => {
        initialAttendance[s.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    if (subjectId) fetchStudents(subjectId);
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
      setMessage('Attendance marked successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-pine-900">Mark Attendance</h1>
      </div>

      <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-pine-600 uppercase tracking-wider mb-1.5">Subject</label>
            <select value={selectedSubject} onChange={handleSubjectChange}
              className="w-full px-4 py-2 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400">
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_name} ({s.course_name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-pine-600 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400" />
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-pine-50 text-pine-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {selectedSubject && students.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4 p-3 bg-pine-50 rounded-lg">
              <div className="flex gap-6">
                <span className="text-sm text-pine-600">Total: <strong>{students.length}</strong></span>
                <span className="text-sm text-pine-600">Present: <strong>{presentCount}</strong></span>
                <span className="text-sm text-red-600">Absent: <strong>{absentCount}</strong></span>
              </div>
            </div>

            <table className="w-full">
              <thead style={{ backgroundColor: "#eeebd8" }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Course</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-pine-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-100">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-pine-50">
                    <td className="px-6 py-4 text-sm text-pine-900">{student.roll_number}</td>
                    <td className="px-6 py-4 text-sm font-medium text-pine-900">{student.full_name}</td>
                    <td className="px-6 py-4 text-sm text-pine-600">{student.course_name || student.department || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleAttendance(student.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          attendance[student.id] === 'present'
                            ? 'bg-pine-100 text-pine-700 hover:bg-pine-200'
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
              className="mt-6 w-full bg-pine-700 text-cream py-2.5 rounded-lg hover:bg-pine-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cream"></div>
              ) : (
                <><Save className="w-4 h-4" /> Save Attendance</>
              )}
            </button>
          </>
        )}

        {selectedSubject && students.length === 0 && (
          <div className="text-center py-12 text-pine-500">No students found for this subject</div>
        )}
      </div>
    </div>
  );
};

export default MarkAttendance;

