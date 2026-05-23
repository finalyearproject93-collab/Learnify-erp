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
      case 'admin':    return 'bg-pine-700 text-cream';
      case 'student':  return 'bg-pine-400 text-cream';
      case 'lecturer': return 'bg-pine-500 text-cream';
      default:         return 'bg-pine-300 text-pine-800';
    }
  };

  return (
    <header className="bg-cream border-b border-pine-100 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-pine-700" />
        <span className="text-base font-semibold text-pine-700 tracking-wide">Learnify</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-pine-800">{user?.full_name || 'User'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadge(user?.role)}`}>
              {getRoleLabel(user?.role)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-pine-400 flex items-center justify-center">
            <span className="text-xs font-bold text-cream">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-pine-700 border border-pine-400 rounded-full hover:bg-pine-700 hover:text-cream hover:border-pine-700 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
