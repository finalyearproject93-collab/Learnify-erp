import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':    return 'Administrator';
      case 'student':  return 'Student';
      case 'lecturer': return 'Faculty';
      default:         return role;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':    return 'bg-charcoal-700 text-beige';
      case 'student':  return 'bg-primary-200 text-charcoal-800';
      case 'lecturer': return 'bg-primary-300 text-charcoal-800';
      default:         return 'bg-primary-100 text-charcoal-700';
    }
  };

  return (
    <header className="bg-beige-light border-b border-beige-dark px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-charcoal-700" />
        <span className="text-base font-semibold text-charcoal-800 tracking-wide">Learnify</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-charcoal-800">{user?.full_name || 'User'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadge(user?.role)}`}>
              {getRoleLabel(user?.role)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center">
            <span className="text-xs font-bold text-charcoal-800">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-charcoal-600 border border-charcoal-300 rounded-full hover:bg-charcoal-800 hover:text-beige hover:border-charcoal-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
