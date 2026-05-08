import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { BookOpen, Plus, Beaker, BookText, X } from 'lucide-react';

const FacultySubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject_type: 'theory' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, coursesRes] = await Promise.all([
        api.get('/faculty/subjects'),
        api.get('/admin/courses')  // accessible to lecturers too
      ]);
      setSubjects(subjectsRes.data.subjects);
      setCourses(coursesRes.data.courses);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/faculty/subjects', form);
      setShowModal(false);
      setForm({ subject_type: 'theory' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject');
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{subject.subject_name}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                subject.subject_type === 'lab' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {subject.subject_type === 'lab' ? <Beaker className="w-3 h-3" /> : <BookText className="w-3 h-3" />}
                {subject.subject_type === 'lab' ? 'Lab' : 'Theory'}
              </span>
            </div>
            <p className="text-sm text-gray-500">{subject.course_name}</p>
            <p className="text-sm text-gray-500">Semester {subject.semester} | Year {subject.academic_year}</p>
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">No subjects assigned yet. Add your first subject!</div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Subject</h2>
              <button onClick={() => { setShowModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input type="text" required value={form.subject_name || ''} onChange={e => setForm({...form, subject_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select required value={form.course_id || ''} onChange={e => setForm({...form, course_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <input type="number" min="1" max="10" required value={form.semester || ''} onChange={e => setForm({...form, semester: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input type="number" min="1" max="10" required value={form.credits || ''} onChange={e => setForm({...form, credits: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="subject_type" value="theory" checked={form.subject_type === 'theory'} onChange={e => setForm({...form, subject_type: e.target.value})}
                      className="w-4 h-4 text-primary-600" />
                    <span className="text-sm">Theory</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="subject_type" value="lab" checked={form.subject_type === 'lab'} onChange={e => setForm({...form, subject_type: e.target.value})}
                      className="w-4 h-4 text-primary-600" />
                    <span className="text-sm">Lab</span>
                  </label>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition font-medium">Create Subject</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultySubjects;
