import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { CalendarCheck, CheckCircle, XCircle, Download, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/student/attendance');
      setAttendance(response.data.attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Per-subject stats
  const subjectStats = attendance.reduce((acc, record) => {
    if (!acc[record.subject_name]) acc[record.subject_name] = { present: 0, total: 0 };
    acc[record.subject_name].total++;
    if (record.status === 'present') acc[record.subject_name].present++;
    return acc;
  }, {});

  // Subjects below 75%
  const lowAttendanceSubjects = Object.entries(subjectStats).filter(([, s]) =>
    Math.round((s.present / s.total) * 100) < 75
  );

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const profileRes = await api.get('/student/profile');
      const student = profileRes.data.student;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // ── Header ───────────────────────────────────────────────────
      doc.setFillColor(40, 54, 24);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(254, 250, 224);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Learnify', 14, 13);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Attendance Report', 14, 22);

      // ── Student info ─────────────────────────────────────────────
      doc.setTextColor(40, 54, 24);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(student?.full_name || '', 14, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(96, 108, 56);
      const infoLine = [
        student?.roll_number ? `Roll No: ${student.roll_number}` : '',
        student?.course_name ? `Course: ${student.course_name}` : '',
        student?.semester ? `Semester: ${student.semester}` : '',
      ].filter(Boolean).join('   |   ');
      doc.text(infoLine, 14, 50);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 56);

      doc.setDrawColor(96, 108, 56);
      doc.setLineWidth(0.4);
      doc.line(14, 60, pageWidth - 14, 60);

      // ── Subject summary table ────────────────────────────────────
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 54, 24);
      doc.text('Subject-wise Summary', 14, 68);

      autoTable(doc, {
        startY: 72,
        head: [['Subject', 'Present', 'Total Classes', 'Percentage', 'Status']],
        body: Object.entries(subjectStats).map(([subject, s]) => {
          const pct = Math.round((s.present / s.total) * 100);
          return [subject, s.present, s.total, `${pct}%`, pct >= 75 ? 'Good' : 'Low'];
        }),
        headStyles: { fillColor: [40, 54, 24], textColor: [254, 250, 224], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [40, 54, 24] },
        alternateRowStyles: { fillColor: [232, 240, 216] },
        columnStyles: { 0: { cellWidth: 65 } },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            data.cell.styles.textColor = data.cell.raw === 'Low' ? [185, 28, 28] : [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 14, right: 14 },
      });

      // ── Date-wise detail table ───────────────────────────────────
      const detailY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 54, 24);
      doc.text('Date-wise Details', 14, detailY);

      autoTable(doc, {
        startY: detailY + 4,
        head: [['Date', 'Subject', 'Status']],
        body: attendance.map(r => [
          new Date(r.date).toLocaleDateString(),
          r.subject_name,
          r.status.charAt(0).toUpperCase() + r.status.slice(1),
        ]),
        headStyles: { fillColor: [96, 108, 56], textColor: [254, 250, 224], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [40, 54, 24] },
        alternateRowStyles: { fillColor: [232, 240, 216] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            data.cell.styles.textColor = data.cell.raw === 'Absent' ? [185, 28, 28] : [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 14, right: 14 },
      });

      // ── Page numbers ─────────────────────────────────────────────
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

      doc.save(`attendance_${student?.roll_number || 'student'}.pdf`);
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
        <h1 className="text-2xl font-bold text-pine-900">Attendance Record</h1>
        {attendance.length > 0 && (
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-pine-700 text-cream rounded-full text-sm font-semibold hover:bg-pine-800 transition disabled:opacity-50"
          >
            {downloading
              ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cream" />
              : <Download className="w-4 h-4" />}
            Download Report
          </button>
        )}
      </div>

      {/* ── Low attendance alert ─────────────────────────────────── */}
      {lowAttendanceSubjects.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Low Attendance Warning</p>
              <p className="text-xs text-red-700 mt-0.5 mb-2">
                Your attendance has dropped below 75% in the following subject{lowAttendanceSubjects.length > 1 ? 's' : ''}.
                You may be barred from exams if this continues.
              </p>
              <div className="flex flex-wrap gap-2">
                {lowAttendanceSubjects.map(([subject, s]) => {
                  const pct = Math.round((s.present / s.total) * 100);
                  return (
                    <span key={subject} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 border border-red-200 rounded-full text-xs font-semibold text-red-800">
                      <XCircle className="w-3 h-3" />
                      {subject} — {pct}%
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Per-subject summary cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(subjectStats).map(([subject, stats]) => {
          const percent = Math.round((stats.present / stats.total) * 100);
          const isLow = percent < 75;
          return (
            <div key={subject} className={`rounded-xl shadow-sm p-4 border ${isLow ? 'bg-red-50 border-red-200' : 'bg-cream border-pine-100'}`}>
              <div className="flex items-start justify-between mb-1">
                <p className={`text-sm font-medium ${isLow ? 'text-red-900' : 'text-pine-900'}`}>{subject}</p>
                {isLow && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1">
                  <div className={`flex justify-between text-xs mb-1 ${isLow ? 'text-red-600' : 'text-pine-500'}`}>
                    <span>{stats.present}/{stats.total}</span>
                    <span className="font-semibold">{percent}%</span>
                  </div>
                  <div className="w-full bg-pine-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detailed records table ────────────────────────────────── */}
      <div className="bg-cream rounded-xl shadow-sm border border-pine-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-pine-100 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-pine-600" />
          <h2 className="text-lg font-semibold text-pine-900">Attendance Details</h2>
        </div>
        <table className="w-full">
          <thead style={{ backgroundColor: '#eeebd8' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-pine-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pine-100">
            {attendance.map((record, index) => (
              <tr key={index} className="hover:bg-pine-50">
                <td className="px-6 py-4 text-sm text-pine-900">{new Date(record.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-pine-600">{record.subject_name}</td>
                <td className="px-6 py-4">
                  {record.status === 'present' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3" /> Present
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <XCircle className="w-3 h-3" /> Absent
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendance.length === 0 && (
          <div className="text-center py-12 text-pine-500">No attendance records found</div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
