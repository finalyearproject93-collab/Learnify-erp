import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { Save, AlertTriangle, CheckCircle } from 'lucide-react';

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
  const [messageType, setMessageType] = useState(''); // 'success' | 'error' | 'warning'
  const [alreadyUploaded, setAlreadyUploaded] = useState(false);
  const [checkingUploaded, setCheckingUploaded] = useState(false);

  const maxMarks = EXAM_TYPES.find(e => e.value === examType)?.maxMarks || 20;

  useEffect(() => { fetchSubjects(); }, []);

  // Reset marks when exam type changes
  useEffect(() => {
    if (students.length > 0) {
      const reset = {};
      students.forEach(s => {
        reset[s.id] = { marks_obtained: '', max_marks: maxMarks };
      });
      setMarks(reset);
    }
    // Check if already uploaded whenever subject + examType both set
    if (selectedSubject && examType) {
      checkAlreadyUploaded(selectedSubject, examType);
    } else {
      setAlreadyUploaded(false);
    }
  }, [examType]);

  useEffect(() => {
    if (selectedSubject && examType) {
      checkAlreadyUploaded(selectedSubject, examType);
    } else {
      setAlreadyUploaded(false);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/faculty/subjects');
      setSubjects(res.data.subjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchStudents = async (subjectId) => {
    try {
      const res = await api.get(`/faculty/subjects/${subjectId}/students`);
      setStudents(res.data.students);
      const initialMarks = {};
      res.data.students.forEach(s => {
        initialMarks[s.id] = { marks_obtained: '', max_marks: maxMarks };
      });
      setMarks(initialMarks);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // Check if marks already exist for this subject + exam type combination
  const checkAlreadyUploaded = async (subjectId, type) => {
    if (!subjectId || !type) return;
    setCheckingUploaded(true);
    try {
      const res = await api.get(`/faculty/marks-for-subject?subject_id=${subjectId}`);
      const existing = res.data.marks || [];
      const hasMarks = existing.some(m => m.exam_type === type);
      setAlreadyUploaded(hasMarks);
      if (hasMarks) {
        setMessage(`Marks for "${type}" have already been uploaded for this subject. Use Edit Marks to make changes.`);
        setMessageType('warning');
      } else {
        setMessage('');
        setMessageType('');
      }
    } catch (err) {
      setAlreadyUploaded(false);
    } finally {
      setCheckingUploaded(false);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setMessage('');
    setMessageType('');
    setAlreadyUploaded(false);
    if (subjectId) fetchStudents(subjectId);
    else setStudents([]);
  };

  const handleExamTypeChange = (e) => {
    const type = e.target.value;
    setExamType(type);
    setMessage('');
    setMessageType('');
    setAlreadyUploaded(false);
    if (selectedSubject && type) {
      checkAlreadyUploaded(selectedSubject, type);
    }
  };

  const handleMarkChange = (studentId, value) => {
    const clamped = Math.min(Math.max(0, parseFloat(value) || 0), maxMarks);
    setMarks(prev => ({
      ...prev,
      [studentId]: { marks_obtained: value === '' ? '' : clamped, max_marks: maxMarks }
    }));
  };

  const handleSubmit = async () => {
    if (!examType) { setMessage('Please select an exam type'); setMessageType('error'); return; }
    if (!selectedSubject) { setMessage('Please select a subject'); setMessageType('error'); return; }
    if (alreadyUploaded) return; // blocked

    setLoading(true);
    setMessage('');
    setMessageType('');
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
        setMessageType('error');
        setLoading(false);
        return;
      }

      await api.post('/faculty/marks', {
        subject_id: parseInt(selectedSubject),
        exam_type: examType,
        marks: marksData
      });
      setMessage(`${examType} marks uploaded successfully!`);
      setMessageType('success');
      setAlreadyUploaded(true); // prevent re-upload after success
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to upload marks');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const msgBg = messageType === 'success' ? 'bg-pine-50 border-pine-200 text-pine-700'
              : messageType === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-700';

  const MsgIcon = messageType === 'success' ? CheckCircle : AlertTriangle;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-pine-900">Upload Marks</h1>

      <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5">Subject</label>
            <select value={selectedSubject} onChange={handleSubjectChange}
              className="w-full px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400">
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_name} ({s.course_name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5">Exam Type</label>
            <select value={examType} onChange={handleExamTypeChange}
              className="w-full px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400">
              <option value="">Select Exam Type</option>
              {EXAM_TYPES.map(e => (
                <option key={e.value} value={e.value}>{e.label} (Max: {e.maxMarks})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Max marks info */}
        {examType && !alreadyUploaded && (
          <div className="mb-4 px-4 py-2 bg-pine-50 border border-pine-200 rounded-lg text-sm text-pine-700 inline-block">
            Maximum marks for <strong>{examType}</strong>: <strong>{maxMarks}</strong>
          </div>
        )}

        {/* Status message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm border flex items-start gap-2 ${msgBg}`}>
            <MsgIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Checking spinner */}
        {checkingUploaded && (
          <div className="mb-4 flex items-center gap-2 text-sm text-pine-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pine-500" />
            Checking upload status...
          </div>
        )}

        {/* Student table — only show if not already uploaded */}
        {selectedSubject && examType && students.length > 0 && !alreadyUploaded && !checkingUploaded && (
          <>
            <div className="overflow-hidden rounded-xl border border-pine-100">
              <table className="w-full">
                <thead style={{ backgroundColor: '#eeebd8' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">
                      Marks <span className="text-pine-400 font-normal">(out of {maxMarks})</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pine-100">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-pine-50">
                      <td className="px-6 py-4 text-sm font-mono text-pine-700">{student.roll_number}</td>
                      <td className="px-6 py-4 text-sm font-medium text-pine-900">{student.full_name}</td>
                      <td className="px-6 py-4 text-sm text-pine-600">{student.course_name || student.department || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="0" max={maxMarks} step="0.5"
                            value={marks[student.id]?.marks_obtained ?? ''}
                            onChange={e => handleMarkChange(student.id, e.target.value)}
                            placeholder="0"
                            className="w-24 px-3 py-1.5 border border-pine-200 rounded-lg text-sm bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400"
                          />
                          <span className="text-sm text-pine-400">/ {maxMarks}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-6 w-full bg-pine-700 text-cream py-2.5 rounded-full hover:bg-pine-800 transition font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cream" />
              ) : (
                <><Save className="w-4 h-4" /> Upload Marks</>
              )}
            </button>
          </>
        )}

        {/* Already uploaded — show redirect hint */}
        {alreadyUploaded && !checkingUploaded && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Marks already uploaded</p>
              <p className="text-xs text-amber-700 mt-0.5">
                <strong>{examType}</strong> marks for this subject have already been submitted.
                To make corrections, go to <strong>Edit Marks</strong> in the sidebar.
              </p>
            </div>
          </div>
        )}

        {selectedSubject && !examType && students.length > 0 && (
          <div className="text-center py-8 text-pine-400 text-sm">Select an exam type to enter marks</div>
        )}
        {selectedSubject && students.length === 0 && (
          <div className="text-center py-12 text-pine-500 text-sm">No students enrolled for this subject yet</div>
        )}
        {!selectedSubject && (
          <div className="text-center py-12 text-pine-400 text-sm">Select a subject to get started</div>
        )}
      </div>
    </div>
  );
};

export default UploadMarks;
