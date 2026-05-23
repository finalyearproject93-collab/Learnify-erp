import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { Plus, Beaker, BookText, X, AlertCircle, BookOpen } from 'lucide-react';

const FacultySubjects = () => {
  const [mySubjects, setMySubjects] = useState([]);       // already assigned to me
  const [availableSubjects, setAvailableSubjects] = useState([]); // can still be added
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [assignedRes, availableRes, coursesRes] = await Promise.all([
        api.get('/faculty/subjects'),
        api.get('/faculty/available-subjects'),
        api.get('/faculty/my-courses'),
      ]);
      setMySubjects(assignedRes.data.subjects || []);
      setAvailableSubjects(availableRes.data.subjects || []);
      setCourses(coursesRes.data.courses || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setSelectedSubjectId('');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) { setError('Please select a subject'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/faculty/subjects', { subject_id: parseInt(selectedSubjectId) });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPreview = availableSubjects.find(s => String(s.id) === String(selectedSubjectId));

  const inputCls = "w-full px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400 transition";
  const labelCls = "block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pine-600" />
      </div>
    );
  }

  const noCourseAssigned = courses.length === 0;
  const noSubjectsLeft = availableSubjects.length === 0 && !noCourseAssigned;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-pine-800">My Subjects</h1>
        <button
          onClick={openModal}
          disabled={noCourseAssigned || noSubjectsLeft}
          title={
            noCourseAssigned ? 'Ask admin to assign a course first'
            : noSubjectsLeft ? 'All subjects for your course are already added'
            : 'Add a subject to your list'
          }
          className="flex items-center gap-2 bg-pine-700 text-cream px-5 py-2.5 rounded-full hover:bg-pine-800 transition font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* No course assigned */}
      {noCourseAssigned && (
        <div className="p-4 bg-pine-50 border border-pine-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-pine-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-pine-800">No course assigned yet</p>
            <p className="text-xs text-pine-600 mt-0.5">
              Ask your admin to assign a course to your account. Once assigned, you can pick subjects from that course.
            </p>
          </div>
        </div>
      )}

      {/* All subjects already added */}
      {noSubjectsLeft && mySubjects.length > 0 && (
        <div className="p-3 bg-pine-50 border border-pine-200 rounded-xl text-xs text-pine-600 text-center">
          All subjects for your course have been added to your list.
        </div>
      )}

      {/* My subjects grid */}
      {mySubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySubjects.map((subject) => (
            <div key={subject.id} className="bg-cream rounded-xl p-5 border border-pine-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-pine-900 leading-tight">{subject.subject_name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                  subject.subject_type === 'lab'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {subject.subject_type === 'lab'
                    ? <><Beaker className="w-3 h-3" /> Lab</>
                    : <><BookText className="w-3 h-3" /> Theory</>
                  }
                </span>
              </div>
              <p className="text-sm text-pine-600 font-medium">{subject.course_name}</p>
              <p className="text-xs text-pine-400 mt-1">Semester {subject.semester} · {subject.academic_year}</p>
            </div>
          ))}
        </div>
      ) : (
        !noCourseAssigned && (
          <div className="text-center py-16 text-pine-400 text-sm">
            No subjects added yet. Click <strong>Add Subject</strong> to pick from your course's subjects.
          </div>
        )
      )}

      {/* Add Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-pine-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-cream border border-pine-100 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-pine-100">
              <div>
                <h2 className="text-lg font-bold text-pine-800">Add Subject</h2>
                {courses.length === 1 && (
                  <p className="text-xs text-pine-500 mt-0.5">
                    Course: <span className="font-semibold text-pine-700">{courses[0].course_name}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => { setShowModal(false); setError(''); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-pine-100 text-pine-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Select Subject</label>
                  <select
                    required
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Choose a subject —</option>
                    {/* Group by semester */}
                    {[...new Set(availableSubjects.map(s => s.semester))].sort((a, b) => a - b).map(sem => (
                      <optgroup key={sem} label={`Semester ${sem}`}>
                        {availableSubjects
                          .filter(s => s.semester === sem)
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.subject_name} ({s.subject_type === 'lab' ? 'Lab' : 'Theory'})
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-xs text-pine-400 mt-1">
                    {availableSubjects.length} subject{availableSubjects.length !== 1 ? 's' : ''} available to add
                  </p>
                </div>

                {/* Preview of selected subject */}
                {selectedPreview && (
                  <div className="p-3 bg-pine-50 border border-pine-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-pine-600" />
                      <span className="text-sm font-semibold text-pine-800">{selectedPreview.subject_name}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
                        selectedPreview.subject_type === 'lab'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {selectedPreview.subject_type === 'lab' ? 'Lab' : 'Theory'}
                      </span>
                    </div>
                    <p className="text-xs text-pine-500">
                      Semester {selectedPreview.semester} · {selectedPreview.credits} credits · {selectedPreview.course_name}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setError(''); }}
                    className="flex-1 py-2.5 rounded-full border border-pine-300 text-pine-700 text-sm font-semibold hover:bg-pine-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedSubjectId}
                    className="flex-1 py-2.5 rounded-full bg-pine-700 text-cream text-sm font-semibold hover:bg-pine-800 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cream mx-auto" />
                    ) : 'Add to My Subjects'}
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

export default FacultySubjects;
