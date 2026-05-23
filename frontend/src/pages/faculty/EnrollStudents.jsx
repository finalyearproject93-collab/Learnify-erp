import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { Users, Plus, CheckCircle, AlertCircle, UserCheck, UserMinus, Trash2 } from 'lucide-react';

const EnrollStudents = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);          // all matching students for subject's course
  const [enrolledIds, setEnrolledIds] = useState([]);    // just IDs
  const [enrolledDetails, setEnrolledDetails] = useState([]); // full objects for class list tab
  const [selectedSubject, setSelectedSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [activeTab, setActiveTab] = useState('all');     // 'all' | 'enrolled'

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/faculty/subjects');
      setSubjects(res.data.subjects);
    } catch (err) { console.error(err); }
  };

  const fetchStudentsForSubject = async (subjectId) => {
    try {
      const res = await api.get(`/faculty/all-students?subject_id=${subjectId}`);
      setStudents(res.data.students);
    } catch (err) { setStudents([]); }
  };

  const fetchEnrolled = async (subjectId) => {
    try {
      const res = await api.get(`/faculty/enrolled-students?subject_id=${subjectId}`);
      setEnrolledIds(res.data.students.map(s => s.id));
      setEnrolledDetails(res.data.students);
    } catch (err) { console.error(err); }
  };

  const handleSubjectChange = (e) => {
    const id = e.target.value;
    setSelectedSubject(id);
    setMessage(''); setError('');
    setStudents([]); setEnrolledIds([]); setEnrolledDetails([]);
    setActiveTab('all');
    if (id) { fetchStudentsForSubject(id); fetchEnrolled(id); }
  };

  const handleEnroll = async (studentId) => {
    setEnrolling(studentId); setMessage(''); setError('');
    try {
      await api.post('/faculty/enroll-student', {
        subject_id: parseInt(selectedSubject),
        student_id: parseInt(studentId)
      });
      setEnrolledIds(prev => [...prev, studentId]);
      const s = students.find(s => s.id === studentId);
      if (s) setEnrolledDetails(prev => [...prev, s]);
      setMessage('Student enrolled successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll student');
      setTimeout(() => setError(''), 4000);
    } finally { setEnrolling(null); }
  };

  const handleRemove = async (studentId, studentName) => {
    if (!window.confirm(`Remove ${studentName} from this subject's class list?`)) return;
    setRemoving(studentId); setMessage(''); setError('');
    try {
      await api.post('/faculty/unenroll-student', {
        subject_id: parseInt(selectedSubject),
        student_id: parseInt(studentId)
      });
      setEnrolledIds(prev => prev.filter(id => id !== studentId));
      setEnrolledDetails(prev => prev.filter(s => s.id !== studentId));
      setMessage('Student removed from class list');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove student');
      setTimeout(() => setError(''), 4000);
    } finally { setRemoving(null); }
  };

  const isEnrolled = (id) => enrolledIds.includes(id);

  const selectedSubjectObj = subjects.find(s => String(s.id) === String(selectedSubject));

  // Sort all students: semester asc → roll_number asc
  const sortedStudents = [...students].sort((a, b) => {
    if (a.semester !== b.semester) return a.semester - b.semester;
    return a.roll_number.localeCompare(b.roll_number);
  });

  const groupedBySemester = sortedStudents.reduce((acc, s) => {
    const sem = s.semester || 1;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(s);
    return acc;
  }, {});

  // Sort enrolled list by roll_number
  const sortedEnrolled = [...enrolledDetails].sort((a, b) =>
    a.roll_number.localeCompare(b.roll_number)
  );

  const thCls = "px-6 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-pine-800">Enroll Students</h1>

      <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">

        {/* Subject selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5">
            Select Subject
          </label>
          <select
            value={selectedSubject}
            onChange={handleSubjectChange}
            className="w-full md:w-96 px-4 py-2.5 bg-cream border border-pine-200 rounded-lg text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400 transition"
          >
            <option value="">— Choose a subject —</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.subject_name} ({s.course_name})</option>
            ))}
          </select>
        </div>

        {/* Feedback */}
        {message && (
          <div className="mb-4 p-3 bg-pine-50 border border-pine-200 text-pine-700 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {selectedSubject ? (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  activeTab === 'all'
                    ? 'bg-pine-700 text-cream'
                    : 'bg-cream border border-pine-200 text-pine-700 hover:bg-pine-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  All Students ({students.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('enrolled')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  activeTab === 'enrolled'
                    ? 'bg-pine-700 text-cream'
                    : 'bg-cream border border-pine-200 text-pine-700 hover:bg-pine-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Class List ({enrolledIds.length})
                </span>
              </button>
            </div>

            {/* ── TAB: All Students ── */}
            {activeTab === 'all' && (
              <div className="border border-pine-100 rounded-xl overflow-hidden">
                <div className="px-6 py-3 flex items-center gap-2" style={{ backgroundColor: '#f5f2e0' }}>
                  <Users className="w-4 h-4 text-pine-600" />
                  <span className="text-sm font-semibold text-pine-800">
                    {selectedSubjectObj?.course_name} students
                  </span>
                  <span className="ml-auto text-xs text-pine-500">
                    {enrolledIds.length} / {students.length} enrolled
                  </span>
                </div>

                {students.length === 0 ? (
                  <div className="text-center py-12 text-pine-400 text-sm">
                    No students found for this course.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead style={{ backgroundColor: '#eeebd8' }}>
                      <tr>
                        <th className={thCls}>Roll No</th>
                        <th className={thCls}>Name</th>
                        <th className={thCls}>Semester</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-pine-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pine-100">
                      {Object.entries(groupedBySemester).map(([sem, semStudents]) => (
                        <React.Fragment key={`sem-${sem}`}>
                          <tr>
                            <td colSpan={4} className="px-6 py-1.5 text-xs font-bold text-pine-600 uppercase tracking-widest"
                              style={{ backgroundColor: '#f0edda' }}>
                              Semester {sem} — {semStudents.length} student{semStudents.length !== 1 ? 's' : ''}
                            </td>
                          </tr>
                          {semStudents.map(student => (
                            <tr key={student.id}
                              className={`transition-colors ${isEnrolled(student.id) ? 'bg-pine-50/60' : 'hover:bg-pine-50'}`}>
                              <td className="px-6 py-3 text-sm font-mono text-pine-700">{student.roll_number}</td>
                              <td className="px-6 py-3 text-sm font-medium text-pine-900">{student.full_name}</td>
                              <td className="px-6 py-3 text-sm text-pine-500">Sem {student.semester}</td>
                              <td className="px-6 py-3 text-right">
                                {isEnrolled(student.id) ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-pine-100 text-pine-700 border border-pine-200">
                                    <CheckCircle className="w-3 h-3" /> Enrolled
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleEnroll(student.id)}
                                    disabled={enrolling === student.id}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-pine-700 text-cream hover:bg-pine-800 transition disabled:opacity-50"
                                  >
                                    {enrolling === student.id
                                      ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cream" />
                                      : <><Plus className="w-3 h-3" /> Enroll</>
                                    }
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── TAB: Class List (enrolled only) ── */}
            {activeTab === 'enrolled' && (
              <div className="border border-pine-100 rounded-xl overflow-hidden">
                <div className="px-6 py-3 flex items-center gap-2" style={{ backgroundColor: '#f5f2e0' }}>
                  <UserCheck className="w-4 h-4 text-pine-600" />
                  <span className="text-sm font-semibold text-pine-800">
                    Class List — {selectedSubjectObj?.subject_name}
                  </span>
                  <span className="ml-auto text-xs text-pine-500">
                    {enrolledIds.length} student{enrolledIds.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {sortedEnrolled.length === 0 ? (
                  <div className="text-center py-12 text-pine-400 text-sm">
                    No students enrolled yet. Go to "All Students" tab to enroll.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead style={{ backgroundColor: '#eeebd8' }}>
                      <tr>
                        <th className={thCls}>Roll No</th>
                        <th className={thCls}>Name</th>
                        <th className={thCls}>Course</th>
                        <th className={thCls}>Semester</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-pine-600 uppercase tracking-wider">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pine-100">
                      {sortedEnrolled.map(student => (
                        <tr key={student.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-mono text-pine-700">{student.roll_number}</td>
                          <td className="px-6 py-3.5 text-sm font-medium text-pine-900">{student.full_name}</td>
                          <td className="px-6 py-3.5 text-sm text-pine-600">{student.course_name || student.department || '—'}</td>
                          <td className="px-6 py-3.5 text-sm text-pine-500">Sem {student.semester}</td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => handleRemove(student.id, student.full_name)}
                              disabled={removing === student.id}
                              title="Remove from class list"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 transition disabled:opacity-40"
                            >
                              {removing === student.id
                                ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500" />
                                : <><Trash2 className="w-3 h-3" /> Remove</>
                              }
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-pine-300 text-sm">
            Select a subject above to manage enrollments
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollStudents;
