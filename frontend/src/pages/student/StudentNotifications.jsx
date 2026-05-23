import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { Bell, AlertCircle, BookOpen, FileText, Clock, Megaphone } from 'lucide-react';

// Map common keywords in the title to an icon for visual variety
const getIcon = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('exam') || t.includes('test'))      return BookOpen;
  if (t.includes('mark') || t.includes('result'))    return FileText;
  if (t.includes('attendance') || t.includes('absent')) return AlertCircle;
  if (t.includes('assignment') || t.includes('deadline')) return Clock;
  return Megaphone;
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/student/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      setError('Failed to load notifications. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pine-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6 text-pine-700" />
        <h1 className="text-2xl font-bold text-pine-800">Notifications</h1>
        {notifications.length > 0 && (
          <span className="ml-auto text-xs bg-pine-700 text-cream px-2.5 py-1 rounded-full font-semibold">
            {notifications.length}
          </span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && notifications.length === 0 && (
        <div className="bg-cream border border-pine-100 rounded-xl shadow-sm p-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-pine-100 rounded-full flex items-center justify-center">
            <Bell className="w-7 h-7 text-pine-400" />
          </div>
          <p className="text-pine-700 font-semibold">No notifications yet</p>
          <p className="text-pine-400 text-sm max-w-xs">
            Your faculty will send announcements, exam alerts, and reminders here.
          </p>
        </div>
      )}

      {/* Notification list */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = getIcon(notif.title);
            return (
              <div
                key={notif.id}
                className="bg-cream border border-pine-100 rounded-xl shadow-sm p-5 hover:border-pine-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon badge */}
                  <div className="w-10 h-10 bg-pine-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-pine-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-sm font-semibold text-pine-900 leading-snug">
                        {notif.title}
                      </p>
                      <span className="text-xs text-pine-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-sm text-pine-700 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Footer meta */}
                    <div className="flex items-center gap-3 mt-3">
                      {notif.sender_name && (
                        <span className="text-xs text-pine-500">
                          — {notif.sender_name}
                        </span>
                      )}
                      <span className="text-xs text-pine-400 ml-auto">
                        {new Date(notif.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
