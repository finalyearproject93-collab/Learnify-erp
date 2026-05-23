import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { Bell, Send, CheckCircle, AlertCircle, Clock, Megaphone, FileText, BookOpen } from 'lucide-react';

const TEMPLATES = [
  {
    label: 'Exam Announcement',
    icon: BookOpen,
    title: 'Upcoming Exam',
    message: 'Dear students, please be informed that the exam is scheduled. Kindly prepare accordingly and bring your ID cards.',
  },
  {
    label: 'Internal Marks Released',
    icon: FileText,
    title: 'Internal Marks Published',
    message: 'The internal assessment marks have been uploaded. Please check your marks in the Marks section.',
  },
  {
    label: 'Attendance Warning',
    icon: AlertCircle,
    title: 'Attendance Shortage Warning',
    message: 'Your attendance is below the required 75%. Please attend classes regularly to avoid being barred from exams.',
  },
  {
    label: 'Assignment Reminder',
    icon: Clock,
    title: 'Assignment Submission Reminder',
    message: 'This is a reminder that the assignment submission deadline is approaching. Please submit on time.',
  },
];

const SendNotification = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('student');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState([]);
  const [loadingSent, setLoadingSent] = useState(true);

  useEffect(() => {
    fetchSent();
  }, []);

  const fetchSent = async () => {
    try {
      const res = await api.get('/faculty/notifications');
      setSent(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSent(false);
    }
  };

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setError('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required');
      return;
    }
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/faculty/notifications', { title, message, target_role: targetRole });
      setSuccess('Notification sent successfully!');
      setTitle('');
      setMessage('');
      fetchSent();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const inputCls = "w-full px-4 py-2.5 bg-cream border border-pine-200 rounded-lg text-pine-800 placeholder-pine-300 focus:outline-none focus:ring-2 focus:ring-pine-400 transition";
  const labelCls = "block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="w-6 h-6 text-pine-700" />
        <h1 className="text-2xl font-bold text-pine-800">Send Notification</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Compose panel */}
        <div className="lg:col-span-2 space-y-5">

          {/* Quick templates */}
          <div className="bg-cream border border-pine-100 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-pine-600 uppercase tracking-wider mb-3">Quick Templates</p>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <button
                    key={tpl.label}
                    onClick={() => applyTemplate(tpl)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-pine-200 text-pine-700 text-sm font-medium hover:bg-pine-50 hover:border-pine-400 transition text-left"
                  >
                    <Icon className="w-4 h-4 text-pine-500 flex-shrink-0" />
                    {tpl.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compose form */}
          <div className="bg-cream border border-pine-100 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-pine-600 uppercase tracking-wider mb-4">Compose Message</p>

            {success && (
              <div className="mb-4 p-3 bg-pine-50 border border-pine-200 text-pine-700 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className={labelCls}>Send To</label>
                <select value={targetRole} onChange={e => setTargetRole(e.target.value)} className={inputCls}>
                  <option value="student">All Students</option>
                  <option value="all">Everyone (Students + Faculty)</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Title / Subject</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Upcoming Exam Announcement"
                  className={inputCls}
                  maxLength={200}
                />
                <p className="text-xs text-pine-400 mt-1 text-right">{title.length}/200</p>
              </div>

              <div>
                <label className={labelCls}>Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your announcement or message here..."
                  rows={5}
                  className={inputCls + ' resize-none'}
                  maxLength={1000}
                />
                <p className="text-xs text-pine-400 mt-1 text-right">{message.length}/1000</p>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-pine-700 text-cream py-3 rounded-full hover:bg-pine-800 transition font-semibold text-sm tracking-wide disabled:opacity-50"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cream" />
                ) : (
                  <><Send className="w-4 h-4" /> Send Notification</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Sent history */}
        <div className="bg-cream border border-pine-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-pine-100 flex items-center gap-2" style={{ backgroundColor: '#f5f2e0' }}>
            <Bell className="w-4 h-4 text-pine-600" />
            <span className="text-sm font-semibold text-pine-800">Sent Notifications</span>
            <span className="ml-auto text-xs text-pine-500">{sent.length} total</span>
          </div>

          {loadingSent ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pine-600" />
            </div>
          ) : sent.length === 0 ? (
            <div className="text-center py-12 text-pine-400 text-sm">No notifications sent yet</div>
          ) : (
            <div className="divide-y divide-pine-100 max-h-[520px] overflow-y-auto">
              {sent.map((n) => (
                <div key={n.id} className="px-5 py-4 hover:bg-pine-50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-pine-900 leading-tight">{n.title}</p>
                    <span className="text-xs text-pine-400 whitespace-nowrap flex-shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-pine-600 line-clamp-2">{n.message}</p>
                  <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-pine-100 text-pine-600 font-medium">
                    → {n.target_role === 'all' ? 'Everyone' : 'Students'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendNotification;
