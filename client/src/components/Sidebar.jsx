import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, UserCheck,
  FileText, UserCircle, CalendarCheck, BarChart3, Upload
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { to: '/admin/dashboard',  label: 'Dashboard',         icon: LayoutDashboard },
    { to: '/admin/users',      label: 'Manage Users',       icon: Users },
    { to: '/admin/courses',    label: 'Courses & Subjects', icon: BookOpen },
  ];

  const studentLinks = [
    { to: '/student/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/student/marks',      label: 'Marks',      icon: FileText },
    { to: '/student/profile',    label: 'Profile',    icon: UserCircle },
  ];

  const facultyLinks = [
    { to: '/faculty/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
    { to: '/faculty/subjects',         label: 'My Subjects',      icon: BookOpen },
    { to: '/faculty/enroll-students',  label: 'Enroll Students',  icon: Users },
    { to: '/faculty/mark-attendance',  label: 'Mark Attendance',  icon: UserCheck },
    { to: '/faculty/upload-marks',     label: 'Upload Marks',     icon: Upload },
    { to: '/faculty/edit-marks',       label: 'Edit Marks',       icon: FileText },
    { to: '/faculty/edit-attendance',  label: 'Edit Attendance',  icon: CalendarCheck },
    { to: '/faculty/attendance-report',label: 'Attendance Report',icon: BarChart3 },
  ];

  const links = user?.role === 'admin' ? adminLinks
              : user?.role === 'student' ? studentLinks
              : user?.role === 'lecturer' ? facultyLinks
              : [];

  const roleLabel = user?.role === 'lecturer' ? 'Faculty'
                  : user?.role === 'admin' ? 'Admin'
                  : 'Student';

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-charcoal-800 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-charcoal-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-200 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-charcoal-800" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-beige tracking-wide">Learnify</h2>
            <p className="text-xs text-charcoal-400">College Management</p>
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
                  ? 'bg-primary-200 text-charcoal-900 font-medium'
                  : 'text-charcoal-300 hover:bg-charcoal-700 hover:text-beige'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-charcoal-800' : 'text-charcoal-400'}`} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User badge at bottom */}
      <div className="px-4 py-4 border-t border-charcoal-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-300 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-charcoal-800">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-beige truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-charcoal-400">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
