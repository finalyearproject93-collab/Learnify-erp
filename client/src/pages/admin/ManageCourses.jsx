import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { BookOpen, Plus, Trash2, X, Beaker, BookText, GraduationCap } from 'lucide-react';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [courseForm, setCourseForm] = useState({});
  const [subjectForm, setSubjectForm] = useState({ subject_type: 'theory' });
  const [error, setError] = useState('');
  const [subjectCounts, setSubjectCounts] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, subjectsRes] = await Promise.all([
        api.get('/admin/courses'),
        api.get('/admin/subjects')
      ]);
      setCourses(coursesRes.data.courses);
      setSubjects(subjectsRes.data.subjects);
      const counts = {};
      subjectsRes.data.subjects.forEach(s => {
        counts[s.course_id] = (counts[s.course_id] || 0) + 1;
      });
      setSubjectCounts(counts);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/courses', courseForm);
      setShowCourseModal(false);
      setCourseForm({});
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/subjects', subjectForm);
      setShowSubjectModal(false);
      setSubjectForm({ subject_type: 'theory' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course? All subjects will also be deleted.')) return;
    try { await api.delete(`/admin/courses/${id}`); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try { await api.delete(`/admin/subjects/${id}`); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const getSubjectCount = (courseId) => subjectCounts[courseId] || 0;

  // Group subjects by course_id
  const subjectsByCourse = subjects.reduce((acc, s) => {
    if (!acc[s.course_id]) acc[s.course_id] = [];
    acc[s.course_id].push(s);
    return acc;
  }, {});

  const inputCls = "w-full px-4 py-2.5 bg-cream border border-pine-200 rounded-lg text-pine-800 placeholder-pine-300 focus:outline-none focus:ring-2 focus:ring-pine-400 transition";
  const labelCls = "block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5";
  const thCls = "px-6 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pine-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-pine-800">Courses & Subjects</h1>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowCourseModal(true); setError(''); }}
            className="flex items-center gap-2 bg-pine-700 text-cream px-5 py-2.5 rounded-full hover:bg-pine-800 transition font-semibold text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Course
          </button>
          <button
            onClick={() => { setShowSubjectModal(true); setError(''); }}
            className="flex items-center gap-2 bg-pine-400 text-cream px-5 py-2.5 rounded-full hover:bg-pine-500 transition font-semibold text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Courses table */}
      <div className="bg-cream border border-pine-100 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-pine-100 flex items-center gap-2" style={{ backgroundColor: '#f5f2e0' }}>
          <BookOpen className="w-5 h-5 text-pine-600" />
          <h2 className="text-base font-semibold text-pine-800">Courses</h2>
          <span className="ml-auto text-xs text-pine-500">{courses.length} total</span>
        </div>
        <table className="w-full">
          <thead style={{ backgroundColor: '#eeebd8' }}>
            <tr>
              <th className={thCls}>Course Name</th>
              <th className={thCls}>Department</th>
              <th className={thCls}>Duration</th>
              <th className={thCls}>Subjects</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-pine-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pine-100">
            {courses.map(course => (
              <tr key={course.id} className="hover:bg-pine-50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-pine-900">{course.course_name}</td>
                <td className="px-6 py-4 text-sm text-pine-600">{course.department}</td>
                <td className="px-6 py-4 text-sm text-pine-600">{course.duration_years} Years</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    getSubjectCount(course.id) >= 10
                      ? 'bg-red-100 text-red-700'
                      : getSubjectCount(course.id) > 0
                        ? 'bg-pine-100 text-pine-700'
                        : 'bg-pine-50 text-pine-400'
                  }`}>
                    {getSubjectCount(course.id)} / 10
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDeleteCourse(course.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && <div className="text-center py-10 text-pine-400">No courses yet</div>}
      </div>

      {/* Subjects grouped by course */}
      {courses.map(course => {
        const courseSubjects = subjectsByCourse[course.id] || [];
        return (
          <div key={course.id} className="bg-cream border border-pine-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-pine-100 flex items-center gap-3" style={{ backgroundColor: '#f5f2e0' }}>
              <GraduationCap className="w-5 h-5 text-pine-600" />
              <h2 className="text-base font-semibold text-pine-800">{course.course_name}</h2>
              <span className="text-xs text-pine-500">{course.department}</span>
              <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${
                courseSubjects.length >= 10 ? 'bg-red-100 text-red-700' : 'bg-pine-100 text-pine-700'
              }`}>
                {courseSubjects.length} / 10 subjects
              </span>
            </div>

            {courseSubjects.length === 0 ? (
              <div className="text-center py-8 text-pine-300 text-sm">
                No subjects added for {course.course_name} yet
              </div>
            ) : (
              <table className="w-full">
                <thead style={{ backgroundColor: '#eeebd8' }}>
                  <tr>
                    <th className={thCls}>Subject</th>
                    <th className={thCls}>Type</th>
                    <th className={thCls}>Semester</th>
                    <th className={thCls}>Credits</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-pine-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pine-100">
                  {courseSubjects
                    .sort((a, b) => a.semester - b.semester || a.subject_name.localeCompare(b.subject_name))
                    .map(subject => (
                      <tr key={subject.id} className="hover:bg-pine-50 transition-colors">
                        <td className="px-6 py-3.5 text-sm font-medium text-pine-900">{subject.subject_name}</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            subject.subject_type === 'lab'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {subject.subject_type === 'lab'
                              ? <><Beaker className="w-3 h-3" /> Lab</>
                              : <><BookText className="w-3 h-3" /> Theory</>
                            }
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-pine-600">Sem {subject.semester}</td>
                        <td className="px-6 py-3.5 text-sm text-pine-600">{subject.credits}</td>
                        <td className="px-6 py-3.5 text-right">
                          <button onClick={() => handleDeleteSubject(subject.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-pine-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-cream border border-pine-100 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-pine-100">
              <h2 className="text-lg font-bold text-pine-800">Add Course</h2>
              <button onClick={() => setShowCourseModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-pine-100 text-pine-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className={labelCls}>Course Name</label>
                  <input type="text" required value={courseForm.course_name || ''}
                    onChange={e => setCourseForm({ ...courseForm, course_name: e.target.value })}
                    className={inputCls} placeholder="e.g., BCA" />
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <input type="text" required value={courseForm.department || ''}
                    onChange={e => setCourseForm({ ...courseForm, department: e.target.value })}
                    className={inputCls} placeholder="e.g., Computer Science" />
                </div>
                <div>
                  <label className={labelCls}>Duration (Years)</label>
                  <input type="number" min="1" max="6" required value={courseForm.duration_years || ''}
                    onChange={e => setCourseForm({ ...courseForm, duration_years: e.target.value })}
                    className={inputCls} placeholder="3" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowCourseModal(false)}
                    className="flex-1 py-2.5 rounded-full border border-pine-300 text-pine-700 text-sm font-semibold hover:bg-pine-50 transition">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-full bg-pine-700 text-cream text-sm font-semibold hover:bg-pine-800 transition">
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-pine-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-cream border border-pine-100 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-pine-100">
              <h2 className="text-lg font-bold text-pine-800">Add Subject</h2>
              <button onClick={() => { setShowSubjectModal(false); setError(''); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-pine-100 text-pine-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div>
                  <label className={labelCls}>Subject Name</label>
                  <input type="text" required value={subjectForm.subject_name || ''}
                    onChange={e => setSubjectForm({ ...subjectForm, subject_name: e.target.value })}
                    className={inputCls} placeholder="e.g., Data Structures" />
                </div>
                <div>
                  <label className={labelCls}>Course</label>
                  <select required value={subjectForm.course_id || ''}
                    onChange={e => setSubjectForm({ ...subjectForm, course_id: e.target.value })}
                    className={inputCls}>
                    <option value="">Select Course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.course_name} ({getSubjectCount(c.id)}/10)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Semester</label>
                    <input type="number" min="1" max="10" required value={subjectForm.semester || ''}
                      onChange={e => setSubjectForm({ ...subjectForm, semester: e.target.value })}
                      className={inputCls} placeholder="1" />
                  </div>
                  <div>
                    <label className={labelCls}>Credits</label>
                    <input type="number" min="1" max="10" required value={subjectForm.credits || ''}
                      onChange={e => setSubjectForm({ ...subjectForm, credits: e.target.value })}
                      className={inputCls} placeholder="3" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Subject Type</label>
                  <div className="flex gap-6">
                    {['theory', 'lab'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="subject_type" value={type}
                          checked={subjectForm.subject_type === type}
                          onChange={e => setSubjectForm({ ...subjectForm, subject_type: e.target.value })}
                          className="w-4 h-4 accent-pine-700" />
                        <span className="text-sm text-pine-800 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setShowSubjectModal(false); setError(''); }}
                    className="flex-1 py-2.5 rounded-full border border-pine-300 text-pine-700 text-sm font-semibold hover:bg-pine-50 transition">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-full bg-pine-400 text-cream text-sm font-semibold hover:bg-pine-500 transition">
                    Create Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
