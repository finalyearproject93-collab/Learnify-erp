import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axios';
import { FileText, BookOpen, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const INTERNAL_TYPES = ['1st Internal', '2nd Internal'];

const StudentMarks = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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

  const subjectWise = marks.reduce((acc, mark) => {
    if (!acc[mark.subject_name]) acc[mark.subject_name] = {};
    acc[mark.subject_name][mark.exam_type] = mark;
    return acc;
  }, {});

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      // Fetch student profile for name/roll/course info
      const profileRes = await api.get('/student/profile');
      const student = profileRes.data.student;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // ── Header bar ──────────────────────────────────────────────
      doc.setFillColor(40, 54, 24); // pine-700
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(254, 250, 224);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Learnify', 14, 13);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Internal Marks Card', 14, 22);

      // ── Student info block ───────────────────────────────────────
      doc.setTextColor(40, 54, 24);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(student?.full_name || user?.full_name || '', 14, 42);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(96, 108, 56);
      const infoLine1 = [
        student?.roll_number ? `Roll No: ${student.roll_number}` : '',
        student?.course_name ? `Course: ${student.course_name}` : '',
        student?.semester ? `Semester: ${student.semester}` : '',
      ].filter(Boolean).join('   |   ');
      doc.text(infoLine1, 14, 50);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 56);

      // ── Divider ──────────────────────────────────────────────────
      doc.setDrawColor(96, 108, 56);
      doc.setLineWidth(0.4);
      doc.line(14, 60, pageWidth - 14, 60);

      // ── Subject-wise summary table ───────────────────────────────
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 54, 24);
      doc.text('Subject-wise Summary', 14, 68);

      const summaryRows = Object.entries(subjectWise).map(([subject, examMap]) => {
        const total = INTERNAL_TYPES.reduce((sum, t) =>
          sum + (examMap[t] ? parseFloat(examMap[t].marks_obtained) : 0), 0);
        const maxTotal = INTERNAL_TYPES.reduce((sum, t) =>
          sum + (examMap[t] ? parseFloat(examMap[t].max_marks) : 20), 0);
        const pct = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : '0.0';
        const internals = INTERNAL_TYPES.map(t =>
          examMap[t] ? `${examMap[t].marks_obtained}/${examMap[t].max_marks}` : 'N/A'
        );
        return [subject, ...internals, `${total}/${maxTotal}`, `${pct}%`, parseFloat(pct) >= 50 ? 'Pass' : 'Fail'];
      });

      autoTable(doc, {
        startY: 72,
        head: [['Subject', '1st Internal', '2nd Internal', 'Total', 'Percentage', 'Result']],
        body: summaryRows,
        headStyles: { fillColor: [40, 54, 24], textColor: [254, 250, 224], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [40, 54, 24] },
        alternateRowStyles: { fillColor: [232, 240, 216] },
        columnStyles: { 0: { cellWidth: 55 } },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            data.cell.styles.textColor = data.cell.raw === 'Fail' ? [185, 28, 28] : [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 14, right: 14 },
      });

      // ── Detailed marks table ─────────────────────────────────────
      const detailY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 54, 24);
      doc.text('Detailed Marks', 14, detailY);

      autoTable(doc, {
        startY: detailY + 4,
        head: [['Subject', 'Exam Type', 'Marks Obtained', 'Max Marks', 'Percentage', 'Result']],
        body: marks.map(m => {
          const pct = ((parseFloat(m.marks_obtained) / parseFloat(m.max_marks)) * 100).toFixed(1);
          return [
            m.subject_name,
            m.exam_type,
            m.marks_obtained,
            m.max_marks,
            `${pct}%`,
            parseFloat(pct) >= 50 ? 'Pass' : 'Fail',
          ];
        }),
        headStyles: { fillColor: [96, 108, 56], textColor: [254, 250, 224], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [40, 54, 24] },
        alternateRowStyles: { fillColor: [232, 240, 216] },
        columnStyles: { 0: { cellWidth: 55 } },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            data.cell.styles.textColor = data.cell.raw === 'Fail' ? [185, 28, 28] : [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 14, right: 14 },
      });

      // ── Footer ───────────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'right' }
        );
      }

      doc.save(`marks_card_${student?.roll_number || 'student'}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pine-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-pine-900">Internal Marks</h1>
        {marks.length > 0 && (
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-pine-700 text-cream rounded-full text-sm font-semibold hover:bg-pine-800 transition disabled:opacity-50"
          >
            {downloading
              ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cream" />
              : <Download className="w-4 h-4" />}
            Download Marks Card
          </button>
        )}
      </div>

      {Object.keys(subjectWise).length === 0 ? (
        <div className="bg-cream rounded-xl shadow-sm border border-pine-100 p-12 text-center text-pine-500">
          No marks available yet
        </div>
      ) : (
        <>
          {/* Subject-wise cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(subjectWise).map(([subject, examMap]) => {
              const total = INTERNAL_TYPES.reduce((sum, type) =>
                sum + (examMap[type] ? parseFloat(examMap[type].marks_obtained) : 0), 0);
              const maxTotal = INTERNAL_TYPES.reduce((sum, type) =>
                sum + (examMap[type] ? parseFloat(examMap[type].max_marks) : 20), 0);

              return (
                <div key={subject} className="bg-cream rounded-xl shadow-sm border border-pine-100 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-pine-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-pine-600" />
                      </div>
                      <h3 className="font-semibold text-pine-900 text-sm">{subject}</h3>
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
                          <span className="text-sm text-pine-600">{type}</span>
                          {mark ? (
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-pine-100 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${parseFloat(mark.marks_obtained) / parseFloat(mark.max_marks) >= 0.5 ? 'bg-green-500' : 'bg-red-400'}`}
                                  style={{ width: `${(parseFloat(mark.marks_obtained) / parseFloat(mark.max_marks)) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-pine-900 w-12 text-right">
                                {mark.marks_obtained}/{mark.max_marks}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-pine-400 italic">Not uploaded</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-pine-100">
                    <div className="flex justify-between items-center text-xs text-pine-500 mb-1">
                      <span>Total Internal</span>
                      <span className="font-semibold text-pine-700">{total} / {maxTotal}</span>
                    </div>
                    <div className="w-full bg-pine-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${total / maxTotal >= 0.5 ? 'bg-pine-500' : 'bg-red-400'}`}
                        style={{ width: `${(total / maxTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed table */}
          <div className="bg-cream rounded-xl shadow-sm border border-pine-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-pine-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-pine-600" />
              <h2 className="text-lg font-semibold text-pine-900">Detailed Marks</h2>
            </div>
            <table className="w-full">
              <thead style={{ backgroundColor: '#eeebd8' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Exam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Out of</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-100">
                {marks.map((mark, index) => {
                  const pct = (parseFloat(mark.marks_obtained) / parseFloat(mark.max_marks)) * 100;
                  const passed = pct >= 50;
                  return (
                    <tr key={index} className="hover:bg-pine-50">
                      <td className="px-6 py-4 text-sm font-medium text-pine-900">{mark.subject_name}</td>
                      <td className="px-6 py-4 text-sm text-pine-600">{mark.exam_type}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-pine-900">{mark.marks_obtained}</td>
                      <td className="px-6 py-4 text-sm text-pine-500">{mark.max_marks}</td>
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
