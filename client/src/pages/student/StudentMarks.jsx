import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { FileText, BookOpen } from 'lucide-react';

const INTERNAL_TYPES = ['1st Internal', '2nd Internal'];

const StudentMarks = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const response = await api.get('/student/marks');
      setMarks(response.data.marks);
    } catch (error) {
      console.error('Error fetching marks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (obtained, max) => {
    const pct = (obtained / max) * 100;
    if (pct >= 75) return 'text-green-600 bg-green-100';
    if (pct >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Group marks by subject
  const subjectWise = marks.reduce((acc, mark) => {
    if (!acc[mark.subject_name]) acc[mark.subject_name] = {};
    acc[mark.subject_name][mark.exam_type] = mark;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Internal Marks</h1>

      {Object.keys(subjectWise).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          No marks available yet
        </div>
      ) : (
        <>
          {/* Subject-wise internal marks cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(subjectWise).map(([subject, examMap]) => {
              const total = INTERNAL_TYPES.reduce((sum, type) => {
                return sum + (examMap[type] ? parseFloat(examMap[type].marks_obtained) : 0);
              }, 0);
              const maxTotal = INTERNAL_TYPES.reduce((sum, type) => {
                return sum + (examMap[type] ? parseFloat(examMap[type].max_marks) : 20);
              }, 0);

              return (
                <div key={subject} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-primary-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{subject}</h3>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(total, maxTotal)}`}>
                      {total}/{maxTotal}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {INTERNAL_TYPES.map(type => {
                      const mark = examMap[type];
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{type}</span>
                          {mark ? (
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-100 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${parseFloat(mark.marks_obtained) / parseFloat(mark.max_marks) >= 0.5 ? 'bg-green-500' : 'bg-red-400'}`}
                                  style={{ width: `${(parseFloat(mark.marks_obtained) / parseFloat(mark.max_marks)) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                                {mark.marks_obtained}/{mark.max_marks}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not uploaded</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Total bar */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                      <span>Total Internal</span>
                      <span className="font-semibold text-gray-700">{total} / {maxTotal}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${total / maxTotal >= 0.5 ? 'bg-primary-500' : 'bg-red-400'}`}
                        style={{ width: `${(total / maxTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Detailed Marks</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Out of</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {marks.map((mark, index) => {
                  const pct = (parseFloat(mark.marks_obtained) / parseFloat(mark.max_marks)) * 100;
                  const passed = pct >= 50;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{mark.subject_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{mark.exam_type}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{mark.marks_obtained}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{mark.max_marks}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentMarks;
