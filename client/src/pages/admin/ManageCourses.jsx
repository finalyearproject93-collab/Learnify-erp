import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { BookOpen, Plus, Trash2, X, Beaker, BookText } from 'lucide-react';

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

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
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
    try {
      await api.delete(`/admin/courses/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const getSubjectCount = (courseId) => subjectCounts[courseId] || 0;

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
        <h1 className="text-2xl font-bold text-gray-900">Courses & Subjects</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCourseModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
            <Plus className="w-4 h-4" /> Add Course
          </button>
          <button onClick={() => setShowSubjectModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Courses</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses.map(course => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{course.course_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{course.department}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{course.duration_years} Years</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    getSubjectCount(course.id) >= 10 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {getSubjectCount(course.id)} / 10
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:text-red-800 transition"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && <div className="text-center py-8 text-gray-500">No courses found</div>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <BookText className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subjects.map(subject => (
              <tr key={subject.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{subject.subject_name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    subject.subject_type === 'lab' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {subject.subject_type === 'lab' ? <Beaker className="w-3 h-3" /> : <BookText className="w-3 h-3" />}
                    {subject.subject_type === 'lab' ? 'Lab' : 'Theory'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{subject.course_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{subject.semester}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{subject.credits}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDeleteSubject(subject.id)}
                    className="text-red-600 hover:text-red-800 transition"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subjects.length === 0 && <div className="text-center py-8 text-gray-500">No subjects found</div>}
      </div>

      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Course</h2>
              <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <input type="text" required value={courseForm.course_name || ''} onChange={e => setCourseForm({...courseForm, course_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" required value={courseForm.department || ''} onChange={e => setCourseForm({...courseForm, department: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Years)</label>
                <input type="number" min="1" max="6" required value={courseForm.duration_years || ''} onChange={e => setCourseForm({...courseForm, duration_years: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition font-medium">Create Course</button>
            </form>
          </div>
        </div>
      )}

      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Subject</h2>
              <button onClick={() => { setShowSubjectModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input type="text" required value={subjectForm.subject_name || ''} onChange={e => setSubjectForm({...subjectForm, subject_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select required value={subjectForm.course_id || ''} onChange={e => setSubjectForm({...subjectForm, course_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_name} ({getSubjectCount(c.id)}/10)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <input type="number" min="1" max="10" required value={subjectForm.semester || ''} onChange={e => setSubjectForm({...subjectForm, semester: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input type="number" min="1" max="10" required value={subjectForm.credits || ''} onChange={e => setSubjectForm({...subjectForm, credits: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="subject_type" value="theory" checked={subjectForm.subject_type === 'theory'} onChange={e => setSubjectForm({...subjectForm, subject_type: e.target.value})}
                      className="w-4 h-4 text-primary-600" />
                    <span className="text-sm">Theory</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="subject_type" value="lab" checked={subjectForm.subject_type === 'lab'} onChange={e => setSubjectForm({...subjectForm, subject_type: e.target.value})}
                      className="w-4 h-4 text-primary-600" />
                    <span className="text-sm">Lab</span>
                  </label>
                </div>
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition font-medium">Create Subject</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
