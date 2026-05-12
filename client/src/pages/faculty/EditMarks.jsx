import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { FileText, Save, CheckCircle, XCircle, Trash2 } from 'lucide-react';

const EditMarks = () => {
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');
  const [editedMarks, setEditedMarks] = useState({});

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

  const fetchMarks = async (subjectId) => {
    try {
      const response = await api.get(`/faculty/marks-for-subject?subject_id=${subjectId}`);
      setMarks(response.data.marks);
      const initial = {};
      response.data.marks.forEach(m => {
        initial[m.id] = { marks_obtained: m.marks_obtained, max_marks: m.max_marks };
      });
      setEditedMarks(initial);
    } catch (error) {
      console.error('Error fetching marks:', error);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setMarks([]);
    setEditedMarks({});
    setMessage('');
    if (subjectId) fetchMarks(subjectId);
  };

  const handleMarkChange = (markId, value) => {
    setEditedMarks(prev => ({
      ...prev,
      [markId]: { ...prev[markId], marks_obtained: value }
    }));
  };

  const handleDelete = async (markId, studentName, examType) => {
    if (!window.confirm(`Delete ${examType} marks for ${studentName}? This cannot be undone.`)) return;

    setDeletingId(markId);
    setMessage('');
    try {
      await api.delete(`/faculty/marks/${markId}`);
      setMessage('Mark deleted successfully!');
      // Remove from local state immediately
      setMarks(prev => prev.filter(m => m.id !== markId));
      setEditedMarks(prev => {
        const updated = { ...prev };
        delete updated[markId];
        return updated;
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to delete mark');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const changesByExamType = {};

      for (const mark of marks) {
        const edited = editedMarks[mark.id];
        if (!edited) continue;

        const newValue = parseFloat(edited.marks_obtained);
        const oldValue = parseFloat(mark.marks_obtained);

        if (isNaN(newValue) || newValue === oldValue) continue;

        if (!changesByExamType[mark.exam_type]) {
          changesByExamType[mark.exam_type] = [];
        }
        changesByExamType[mark.exam_type].push({
          student_id: mark.student_id,
          marks_obtained: newValue,
          max_marks: parseFloat(edited.max_marks) || mark.max_marks
        });
      }

      const examTypes = Object.keys(changesByExamType);

      if (examTypes.length === 0) {
        setMessage('No changes to save.');
        setLoading(false);
        return;
      }

      for (const examType of examTypes) {
        await api.post('/faculty/marks', {
          subject_id: parseInt(selectedSubject),
          exam_type: examType,
          marks: changesByExamType[examType]
        });
      }

      setMessage('Marks updated successfully!');
      fetchMarks(selectedSubject);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update marks');
    } finally {
      setLoading(false);
    }
  };

  const groupedMarks = marks.reduce((acc, mark) => {
    if (!acc[mark.exam_type]) acc[mark.exam_type] = [];
    acc[mark.exam_type].push(mark);
    return acc;
  }, {});

  const messageType = message.includes('success') ? 'success'
    : message.includes('No changes') ? 'info'
    : 'error';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-pine-900">Edit Marks</h1>

      <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-pine-600 uppercase tracking-wider mb-1.5">Subject</label>
          <select value={selectedSubject} onChange={handleSubjectChange}
            className="w-full md:w-96 px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400">
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.subject_name} ({s.course_name})</option>
            ))}
          </select>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
            messageType === 'success' ? 'bg-pine-50 text-pine-700'
            : messageType === 'info' ? 'bg-pine-50 text-pine-600'
            : 'bg-red-50 text-red-700'
          }`}>
            {messageType === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {message}
          </div>
        )}

        {selectedSubject && marks.length > 0 && (
          <>
            {Object.entries(groupedMarks).map(([examType, examMarks]) => (
              <div key={examType} className="mb-6">
                <h3 className="text-sm font-semibold text-pine-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-pine-600" />
                  {examType}
                  <span className="text-xs font-normal text-gray-400 ml-1">({examMarks.length} students)</span>
                </h3>
                <div className="border border-pine-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead style={{ backgroundColor: "#eeebd8" }}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Marks Obtained</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Max Marks</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-pine-600 uppercase">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pine-100">
                      {examMarks.map(mark => (
                        <tr key={mark.id} className="hover:bg-pine-50">
                          <td className="px-6 py-4 text-sm text-pine-900">{mark.roll_number}</td>
                          <td className="px-6 py-4 text-sm font-medium text-pine-900">{mark.full_name}</td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              max={mark.max_marks}
                              value={editedMarks[mark.id]?.marks_obtained ?? mark.marks_obtained}
                              onChange={e => handleMarkChange(mark.id, e.target.value)}
                              className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-pine-600">{mark.max_marks}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDelete(mark.id, mark.full_name, examType)}
                              disabled={deletingId === mark.id}
                              title="Delete this mark"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition disabled:opacity-40"
                            >
                              {deletingId === mark.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <button onClick={handleSubmit} disabled={loading}
              className="mt-4 w-full bg-pine-700 text-cream py-2.5 rounded-lg hover:bg-pine-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cream" />
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </>
        )}

        {selectedSubject && marks.length === 0 && (
          <div className="text-center py-12 text-pine-500">
            No marks recorded for this subject yet. Use Upload Marks to add marks.
          </div>
        )}

        {!selectedSubject && (
          <div className="text-center py-12 text-pine-400">Select a subject to view marks</div>
        )}
      </div>
    </div>
  );
};

export default EditMarks;

