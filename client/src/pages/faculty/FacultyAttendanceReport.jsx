import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { BarChart3, CheckCircle, XCircle, Download, Calendar, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for max attr

const FacultyAttendanceReport = () => {
  const [subjects, setSubjects]               = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubjectName, setSelectedSubjectName] = useState('');
  const [report, setReport]                   = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [fromDate, setFromDate]               = useState('');
  const [toDate, setToDate]                   = useState('');
  const [dateError, setDateError]             = useState('');
  const [downloading, setDownloading]         = useState(false);

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/faculty/subjects');
      setSubjects(res.data.subjects || []);
    } catch {
      setError('Failed to load subjects. Please refresh the page.');
    }
  };

  const fetchReport = async (subjectId, from, to) => {
    setLoading(true);
    setError('');
    setReport([]);
    try {
      let url = `/faculty/attendance-report?subject_id=${subjectId}`;
      if (from && to) url += `&from_date=${from}&to_date=${to}`;
      const res = await api.get(url);
      setReport(res.data.report || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance report. Please try again.');
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
    setError('');
    setDateError('');
    if (subjectId) fetchReport(subjectId, fromDate, toDate);
  };

  const validateDates = (from, to) => {
    if (from && to && from > to) {
      setDateError('"From" date cannot be after "To" date.');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleFromDateChange = (e) => {
    const val = e.target.value;
    setFromDate(val);
    validateDates(val, toDate);
  };

  const handleToDateChange = (e) => {
    const val = e.target.value;
    setToDate(val);
    validateDates(fromDate, val);
  };

  const handleFilter = () => {
    if (!selectedSubject) return;
    if (!validateDates(fromDate, toDate)) return;
    fetchReport(selectedSubject, fromDate, toDate);
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
    setDateError('');
    if (selectedSubject) fetchReport(selectedSubject, '', '');
  };

  // Normalise percentage: MySQL ROUND() returns a string like "87.50"
  const pct = (row) => parseFloat(row.percentage) || 0;

  const downloadPDF = async () => {
    if (!selectedSubject) return;
    setDownloading(true);
    try {
      let url = `/faculty/attendance-datewise?subject_id=${selectedSubject}`;
      if (fromDate && toDate) url += `&from_date=${fromDate}&to_date=${toDate}`;
      const res = await api.get(url);
      const { records, subject } = res.data;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // ── Header ───────────────────────────────────────────────────
      doc.setFillColor(40, 54, 24);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setTextColor(254, 250, 224);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Learnify', 14, 12);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Attendance Report', 14, 21);

      // ── Subject info ─────────────────────────────────────────────
      doc.setTextColor(40, 54, 24);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(subject?.subject_name || selectedSubjectName, 14, 38);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(96, 108, 56);
      doc.text(`Course: ${subject?.course_name || ''}`, 14, 45);
      const dateRange = fromDate && toDate
        ? `Period: ${new Date(fromDate).toLocaleDateString()} – ${new Date(toDate).toLocaleDateString()}`
        : 'Period: All dates';
      doc.text(dateRange, 14, 51);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 57);

      // ── Summary table ────────────────────────────────────────────
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 54, 24);
      doc.text('Summary', 14, 67);

      autoTable(doc, {
        startY: 71,
        head: [['Roll No', 'Student Name', 'Present', 'Absent', 'Total', 'Percentage', 'Status']],
        body: report.map(r => {
          const p = pct(r);
          const absent = r.total_classes - r.present_count;
          return [r.roll_number, r.full_name, r.present_count, absent, r.total_classes, `${p.toFixed(1)}%`, p >= 75 ? 'Good' : 'Low'];
        }),
        headStyles: { fillColor: [40, 54, 24], textColor: [254, 250, 224], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [40, 54, 24] },
        alternateRowStyles: { fillColor: [232, 240, 216] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) {
            data.cell.styles.textColor = data.cell.raw === 'Low' ? [185, 28, 28] : [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 14, right: 14 },
      });

      // ── Date-wise detail table ───────────────────────────────────
      if (records?.length > 0) {
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
            r.status.charAt(0).toUpperCase() + r.status.slice(1),
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

      // ── Page numbers ─────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      }

      const slug = (subject?.subject_name || 'attendance').replace(/\s+/g, '_');
      doc.save(`attendance_${slug}_${fromDate || 'all'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Summary counts for the stat bar
  const lowCount  = report.filter(r => pct(r) < 75).length;
  const goodCount = report.length - lowCount;

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────── */}
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

      <div className="bg-cream border border-pine-100 rounded-xl p-6 shadow-sm space-y-6">

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4">
          {/* Subject */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400"
            >
              <option value="">— Choose a subject —</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_name} ({s.course_name})</option>
              ))}
            </select>
          </div>

          {/* From date */}
          <div>
            <label className="block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />From Date
            </label>
            <input
              type="date" value={fromDate} max={today}
              onChange={handleFromDateChange}
              className="px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400"
            />
          </div>

          {/* To date */}
          <div>
            <label className="block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />To Date
            </label>
            <input
              type="date" value={toDate} max={today}
              onChange={handleToDateChange}
              className="px-4 py-2.5 border border-pine-200 rounded-lg bg-cream text-pine-800 focus:outline-none focus:ring-2 focus:ring-pine-400"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleFilter}
              disabled={!selectedSubject || !!dateError}
              className="px-4 py-2.5 bg-pine-700 text-cream rounded-lg text-sm font-semibold hover:bg-pine-800 transition disabled:opacity-40"
            >
              Apply Filter
            </button>
            {(fromDate || toDate) && (
              <button
                onClick={handleClearFilter}
                className="px-4 py-2.5 border border-pine-300 text-pine-700 rounded-lg text-sm hover:bg-pine-50 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Date validation error */}
        {dateError && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {dateError}
          </div>
        )}

        {/* Fetch error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pine-600" />
          </div>
        )}

        {/* ── Empty / no-subject states ────────────────────────────── */}
        {!loading && !selectedSubject && !error && (
          <div className="text-center py-16 text-pine-400 text-sm">
            Select a subject above to view the attendance report.
          </div>
        )}

        {!loading && selectedSubject && report.length === 0 && !error && (
          <div className="text-center py-16 text-pine-500 text-sm">
            No attendance records found for this subject
            {fromDate && toDate ? ` between ${new Date(fromDate).toLocaleDateString()} and ${new Date(toDate).toLocaleDateString()}` : ''}.
          </div>
        )}

        {/* ── Report table ─────────────────────────────────────────── */}
        {!loading && report.length > 0 && (
          <>
            {/* Quick stat bar */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-pine-50 border border-pine-200 rounded-lg text-sm">
                <span className="font-semibold text-pine-800">{report.length}</span>
                <span className="text-pine-500">students</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-800">{goodCount}</span>
                <span className="text-green-600">≥ 75%</span>
              </div>
              {lowCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-800">{lowCount}</span>
                  <span className="text-red-600">below 75%</span>
                </div>
              )}
              {fromDate && toDate && (
                <div className="ml-auto flex items-center gap-1 text-xs text-pine-500 bg-pine-50 px-3 py-2 rounded-lg border border-pine-200">
                  <Calendar className="w-3 h-3" />
                  {new Date(fromDate).toLocaleDateString()} – {new Date(toDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Table */}
            <div className="border border-pine-100 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-pine-100 flex items-center gap-2" style={{ backgroundColor: '#f5f2e0' }}>
                <BarChart3 className="w-5 h-5 text-pine-600" />
                <h2 className="text-base font-semibold text-pine-900">Student-wise Attendance</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#eeebd8' }}>
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">Roll No</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">Student Name</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-pine-600 uppercase tracking-wider">Total</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-pine-600 uppercase tracking-wider">Present</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-pine-600 uppercase tracking-wider">Absent</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">Percentage</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pine-100">
                    {report.map((row, index) => {
                      const p       = pct(row);
                      const absent  = row.total_classes - row.present_count;
                      const isLow   = p < 75;
                      const barColor = p >= 75 ? 'bg-green-500' : p >= 50 ? 'bg-amber-400' : 'bg-red-500';

                      return (
                        <tr key={index} className={`hover:bg-pine-50 ${isLow ? 'bg-red-50/40' : ''}`}>
                          <td className="px-5 py-4 text-sm font-mono text-pine-700">{row.roll_number}</td>
                          <td className="px-5 py-4 text-sm font-medium text-pine-900">{row.full_name}</td>
                          <td className="px-5 py-4 text-sm text-pine-600 text-center">{row.total_classes}</td>
                          <td className="px-5 py-4 text-sm text-green-700 font-semibold text-center">{row.present_count}</td>
                          <td className="px-5 py-4 text-sm text-center">
                            <span className={`font-semibold ${absent > 0 ? 'text-red-600' : 'text-pine-400'}`}>
                              {absent}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-pine-100 rounded-full h-2 flex-shrink-0">
                                <div
                                  className={`${barColor} h-2 rounded-full transition-all`}
                                  style={{ width: `${Math.min(p, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-semibold tabular-nums ${isLow ? 'text-red-700' : 'text-pine-900'}`}>
                                {p.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                <XCircle className="w-3 h-3" /> Low
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-pine-100 text-pine-700">
                                <CheckCircle className="w-3 h-3" /> Good
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FacultyAttendanceReport;
