import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { BarChart3, CheckCircle, XCircle } from 'lucide-react';

const FacultyAttendanceReport = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const fetchReport = async (subjectId) => {
    setLoading(true);
    try {
      const response = await api.get(`/faculty/attendance-report?subject_id=${subjectId}`);
      setReport(response.data.report);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    if (subjectId) fetchReport(subjectId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-pine-900">Attendance Report</h1>
      </div>

      <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-pine-600 uppercase tracking-wider mb-1.5">Select Subject</label>
          <select value={selectedSubject} onChange={handleSubjectChange}
            className="w-full md:w-96 px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400">
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.subject_name} ({s.course_name})</option>
            ))}
          </select>
        </div>

        {selectedSubject && loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pine-600"></div>
          </div>
        )}

        {selectedSubject && !loading && report.length > 0 && (
          <div className="bg-cream border border-pine-100 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-pine-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-pine-600" />
              <h2 className="text-lg font-semibold text-pine-900">Student-wise Attendance</h2>
            </div>
            <table className="w-full">
              <thead style={{ backgroundColor: "#eeebd8" }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Total Classes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Present</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-100">
                {report.map((row, index) => (
                  <tr key={index} className="hover:bg-pine-50">
                    <td className="px-6 py-4 text-sm text-pine-900">{row.roll_number}</td>
                    <td className="px-6 py-4 text-sm font-medium text-pine-900">{row.full_name}</td>
                    <td className="px-6 py-4 text-sm text-pine-600">{row.total_classes}</td>
                    <td className="px-6 py-4 text-sm text-pine-600">{row.present_count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(row.percentage, 100)}%` }}></div>
                        </div>
                        <span className="text-sm font-medium text-pine-900">{row.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {row.percentage >= 75 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-pine-100 text-pine-700">
                          <CheckCircle className="w-3 h-3" /> Good
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" /> Low
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedSubject && report.length === 0 && !loading && (
          <div className="text-center py-12 text-pine-500">No attendance data found for this subject</div>
        )}
      </div>
    </div>
  );
};

export default FacultyAttendanceReport;

