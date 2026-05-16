import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, UserCheck,
  FileText, UserCircle, CalendarCheck, BarChart3, Upload, Bell
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { to: '/admin/dashboard',   label: 'Dashboard',          icon: LayoutDashboard },
    { to: '/admin/users',       label: 'Manage Users',        icon: Users },
    { to: '/admin/courses',     label: 'Courses & Subjects',  icon: BookOpen },
  ];

  const studentLinks = [
    { to: '/student/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/student/marks',      label: 'Marks',      icon: FileText },
    { to: '/student/profile',    label: 'Profile',    icon: UserCircle },
  ];

  const facultyLinks = [
    { to: '/faculty/dashboard',         label: 'Dashboard',         icon: LayoutDashboard },
    { to: '/faculty/subjects',          label: 'My Subjects',       icon: BookOpen },
    { to: '/faculty/enroll-students',   label: 'Enroll Students',   icon: Users },
    { to: '/faculty/mark-attendance',   label: 'Mark Attendance',   icon: UserCheck },
    { to: '/faculty/upload-marks',      label: 'Upload Marks',      icon: Upload },
    { to: '/faculty/edit-marks',        label: 'Edit Marks',        icon: FileText },
    { to: '/faculty/edit-attendance',   label: 'Edit Attendance',   icon: CalendarCheck },
    { to: '/faculty/attendance-report', label: 'Attendance Report', icon: BarChart3 },
    { to: '/faculty/notifications',     label: 'Send Notification', icon: Bell },
  ];

  const links = user?.role === 'admin'    ? adminLinks
              : user?.role === 'student'  ? studentLinks
              : user?.role === 'lecturer' ? facultyLinks
              : [];

  const roleLabel = user?.role === 'lecturer' ? 'Faculty'
                  : user?.role === 'admin'    ? 'Admin'
                  : 'Student';

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-pine-700 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-pine-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pine-400 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-cream" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-cream tracking-wide">Learnify</h2>
            <p className="text-xs text-pine-200 opacity-70">College Management</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-pine-400 text-cream font-medium'
                  : 'text-pine-100 hover:bg-pine-600 hover:text-cream'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cream' : 'text-pine-300'}`} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User badge */}
      <div className="px-4 py-4 border-t border-pine-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-pine-400 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-cream">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-cream truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-pine-200 opacity-70">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
