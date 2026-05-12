import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { Save } from 'lucide-react';

const EXAM_TYPES = [
  { label: '1st Internal', value: '1st Internal', maxMarks: 20 },
  { label: '2nd Internal', value: '2nd Internal', maxMarks: 20 },
];

const UploadMarks = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('');
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const maxMarks = EXAM_TYPES.find(e => e.value === examType)?.maxMarks || 20;

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Reset marks input when exam type changes so max is applied correctly
  useEffect(() => {
    if (students.length > 0) {
      const reset = {};
      students.forEach(s => {
        reset[s.id] = { marks_obtained: '', max_marks: maxMarks };
      });
      setMarks(reset);
    }
  }, [examType]);

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
      const initialMarks = {};
      response.data.students.forEach(s => {
        initialMarks[s.id] = { marks_obtained: '', max_marks: maxMarks };
      });
      setMarks(initialMarks);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setMessage('');
    if (subjectId) fetchStudents(subjectId);
    else setStudents([]);
  };

  const handleMarkChange = (studentId, value) => {
    // Clamp value between 0 and maxMarks
    const clamped = Math.min(Math.max(0, parseFloat(value) || 0), maxMarks);
    setMarks(prev => ({
      ...prev,
      [studentId]: { marks_obtained: value === '' ? '' : clamped, max_marks: maxMarks }
    }));
  };

  const handleSubmit = async () => {
    if (!examType) { setMessage('Please select an exam type'); return; }
    if (!selectedSubject) { setMessage('Please select a subject'); return; }

    setLoading(true);
    setMessage('');
    try {
      const marksData = Object.entries(marks)
        .filter(([_, data]) => data.marks_obtained !== '')
        .map(([studentId, data]) => ({
          student_id: parseInt(studentId),
          marks_obtained: parseFloat(data.marks_obtained),
          max_marks: maxMarks
        }));

      if (marksData.length === 0) {
        setMessage('Please enter marks for at least one student');
        setLoading(false);
        return;
      }

      await api.post('/faculty/marks', {
        subject_id: parseInt(selectedSubject),
        exam_type: examType,
        marks: marksData
      });
      setMessage('Marks uploaded successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to upload marks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-pine-900">Upload Marks</h1>

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
            <label className="block text-sm font-semibold text-pine-600 uppercase tracking-wider mb-1.5">Exam Type</label>
            <select value={examType} onChange={e => setExamType(e.target.value)}
              className="w-full px-4 py-2 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400">
              <option value="">Select Exam Type</option>
              {EXAM_TYPES.map(e => (
                <option key={e.value} value={e.value}>{e.label} (Max: {e.maxMarks})</option>
              ))}
            </select>
          </div>
        </div>

        {examType && (
          <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 inline-block">
            Maximum marks for <strong>{examType}</strong>: <strong>{maxMarks}</strong>
          </div>
        )}

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-pine-50 text-pine-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {selectedSubject && examType && students.length > 0 && (
          <>
            <div className="overflow-hidden rounded-xl border border-pine-100">
              <table className="w-full">
                <thead style={{ backgroundColor: "#eeebd8" }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">
                      Marks Obtained <span className="text-gray-400 font-normal">(out of {maxMarks})</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pine-100">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-pine-50">
                      <td className="px-6 py-4 text-sm text-pine-900">{student.roll_number}</td>
                      <td className="px-6 py-4 text-sm font-medium text-pine-900">{student.full_name}</td>
                      <td className="px-6 py-4 text-sm text-pine-600">{student.course_name || student.department || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            value={marks[student.id]?.marks_obtained ?? ''}
                            onChange={e => handleMarkChange(student.id, e.target.value)}
                            placeholder="0"
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-sm text-pine-400">/ {maxMarks}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="mt-6 w-full bg-pine-700 text-cream py-2.5 rounded-lg hover:bg-pine-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cream" />
              ) : (
                <><Save className="w-4 h-4" /> Upload Marks</>
              )}
            </button>
          </>
        )}

        {selectedSubject && !examType && students.length > 0 && (
          <div className="text-center py-8 text-pine-400">Select an exam type to enter marks</div>
        )}

        {selectedSubject && students.length === 0 && (
          <div className="text-center py-12 text-pine-500">No students enrolled for this subject yet</div>
        )}

        {!selectedSubject && (
          <div className="text-center py-12 text-pine-400">Select a subject to get started</div>
        )}
      </div>
    </div>
  );
};

export default UploadMarks;

