import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { BarChart3, CheckCircle, XCircle, Download, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FacultyAttendanceReport = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubjectName, setSelectedSubjectName] = useState('');
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [downloading, setDownloading] = useState(false);

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

  const fetchReport = async (subjectId, from, to) => {
    setLoading(true);
    try {
      let url = `/faculty/attendance-report?subject_id=${subjectId}`;
      if (from && to) url += `&from_date=${from}&to_date=${to}`;
      const response = await api.get(url);
      setReport(response.data.report);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    const subjectObj = subjects.find(s => String(s.id) === subjectId);
    setSelectedSubject(subjectId);
    setSelectedSubjectName(subjectObj ? `${subjectObj.subject_name} (${subjectObj.course_name})` : '');
    setReport([]);
    if (subjectId) fetchReport(subjectId, fromDate, toDate);
  };

  const handleFilter = () => {
    if (selectedSubject) fetchReport(selectedSubject, fromDate, toDate);
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
    if (selectedSubject) fetchReport(selectedSubject, '', '');
  };

  const downloadPDF = async () => {
    if (!selectedSubject) return;
    setDownloading(true);
    try {
      // Fetch date-wise detailed records
      let url = `/faculty/attendance-datewise?subject_id=${selectedSubject}`;
      if (fromDate && toDate) url += `&from_date=${fromDate}&to_date=${toDate}`;
      const res = await api.get(url);
      const { records, subject } = res.data;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(40, 54, 24); // pine-700
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setTextColor(254, 250, 224); // cream
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Learnify', 14, 12);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Attendance Report', 14, 21);

      // Subject info
      doc.setTextColor(40, 54, 24);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(subject?.subject_name || selectedSubjectName, 14, 38);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(96, 108, 56); // pine-400
      doc.text(`Course: ${subject?.course_name || ''}`, 14, 45);
      const dateRange = fromDate && toDate
        ? `Period: ${new Date(fromDate).toLocaleDateString()} – ${new Date(toDate).toLocaleDateString()}`
        : `Period: All dates`;
      doc.text(dateRange, 14, 51);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 57);

      // Summary table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 54, 24);
      doc.text('Summary', 14, 67);

      autoTable(doc, {
        startY: 71,
        head: [['Roll No', 'Student Name', 'Present', 'Total', 'Percentage', 'Status']],
        body: report.map(r => [
          r.roll_number,
          r.full_name,
          r.present_count,
          r.total_classes,
          `${r.percentage}%`,
          r.percentage >= 75 ? 'Good' : 'Low'
        ]),
        headStyles: { fillColor: [40, 54, 24], textColor: [254, 250, 224], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [40, 54, 24] },
        alternateRowStyles: { fillColor: [232, 240, 216] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const val = data.cell.raw;
            data.cell.styles.textColor = val === 'Low' ? [185, 28, 28] : [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 14, right: 14 },
      });

      // Date-wise detail table
      if (records && records.length > 0) {
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 54, 24);
        doc.text('Date-wise Details', 14, finalY);

        autoTable(doc, {
          startY: finalY + 4,
          head: [['Date', 'Roll No', 'Student Name', 'Status']],
          body: records.map(r => [
            new Date(r.date).toLocaleDateString(),
            r.roll_number,
            r.full_name,
            r.status.charAt(0).toUpperCase() + r.status.slice(1)
          ]),
          headStyles: { fillColor: [96, 108, 56], textColor: [254, 250, 224], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9, textColor: [40, 54, 24] },
          alternateRowStyles: { fillColor: [232, 240, 216] },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
              data.cell.styles.textColor = data.cell.raw === 'Absent' ? [185, 28, 28] : [21, 128, 61];
              data.cell.styles.fontStyle = 'bold';
            }
          },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      }

      const subjectSlug = (subject?.subject_name || 'attendance').replace(/\s+/g, '_');
      doc.save(`attendance_${subjectSlug}_${fromDate || 'all'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-pine-900">Attendance Report</h1>
        {report.length > 0 && (
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-pine-700 text-cream rounded-full text-sm font-semibold hover:bg-pine-800 transition disabled:opacity-50"
          >
            {downloading
              ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cream" />
              : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        )}
      </div>

      <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5">Select Subject</label>
            <select value={selectedSubject} onChange={handleSubjectChange}
              className="w-full px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400">
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_name} ({s.course_name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />From Date
            </label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />To Date
            </label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400" />
          </div>

          <div className="flex items-end gap-2">
            <button onClick={handleFilter} disabled={!selectedSubject}
              className="px-4 py-2.5 bg-pine-700 text-cream rounded-lg text-sm font-semibold hover:bg-pine-800 transition disabled:opacity-40">
              Apply Filter
            </button>
            {(fromDate || toDate) && (
              <button onClick={handleClearFilter}
                className="px-4 py-2.5 border border-pine-300 text-pine-700 rounded-lg text-sm hover:bg-pine-50 transition">
                Clear
              </button>
            )}
          </div>
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
              {fromDate && toDate && (
                <span className="ml-auto text-xs text-pine-500 bg-pine-50 px-2 py-1 rounded-full border border-pine-200">
                  {new Date(fromDate).toLocaleDateString()} – {new Date(toDate).toLocaleDateString()}
                </span>
              )}
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
        {!selectedSubject && (
          <div className="text-center py-12 text-pine-400">Select a subject to view the report</div>
        )}
      </div>
    </div>
  );
};

export default FacultyAttendanceReport;
