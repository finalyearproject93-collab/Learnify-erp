import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { Users, Plus, CheckCircle, AlertCircle } from 'lucide-react';

const EnrollStudents = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(null); // track which student is being enrolled

  useEffect(() => {
    fetchSubjects();
    fetchAllStudents();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/faculty/subjects');
      setSubjects(response.data.subjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await api.get('/faculty/all-students');
      setStudents(response.data.students);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchEnrolled = async (subjectId) => {
    try {
      const response = await api.get(`/faculty/enrolled-students?subject_id=${subjectId}`);
      setEnrolledStudents(response.data.students.map(s => s.id));
    } catch (err) {
      console.error('Error fetching enrolled:', err);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setMessage('');
    setError('');
    if (subjectId) fetchEnrolled(subjectId);
    else setEnrolledStudents([]);
  };

  const handleEnroll = async (studentId) => {
    setEnrolling(studentId);
    setMessage('');
    setError('');
    try {
      await api.post('/faculty/enroll-student', {
        subject_id: parseInt(selectedSubject),
        student_id: parseInt(studentId)
      });
      setEnrolledStudents(prev => [...prev, studentId]);
      setMessage('Student enrolled successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to enroll student';
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (studentId) => enrolledStudents.includes(studentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Enroll Students</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
          <select value={selectedSubject} onChange={handleSubjectChange}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.subject_name} ({s.course_name})</option>
            ))}
          </select>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {selectedSubject && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">All Students</h2>
              <span className="text-sm text-gray-500 ml-auto">{enrolledStudents.length} enrolled</span>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No students registered yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{student.roll_number}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.full_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.course_name || student.department || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.semester}</td>
                      <td className="px-6 py-4 text-right">
                        {isEnrolled(student.id) ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-4 h-4" /> Enrolled
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEnroll(student.id)}
                            disabled={enrolling === student.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
                          >
                            {enrolling === student.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <><Plus className="w-4 h-4" /> Enroll</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!selectedSubject && (
          <div className="text-center py-12 text-gray-400">Select a subject to enroll students</div>
        )}
      </div>
    </div>
  );
};

export default EnrollStudents;
