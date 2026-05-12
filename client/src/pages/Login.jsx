import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, User, Shield, ArrowRight, AlertCircle, WifiOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, serverDown } = useAuth();
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getUsernameLabel = () => {
    switch (role) {
      case 'student':  return 'Roll Number';
      case 'lecturer': return 'Employee ID';
      case 'admin':    return 'Email';
      default:         return 'Username';
    }
  };

  const getUsernamePlaceholder = () => {
    switch (role) {
      case 'student':  return 'e.g. E26001';
      case 'lecturer': return 'e.g. EMP001';
      case 'admin':    return 'admin@example.com';
      default:         return 'Enter username';
    }
  };

  const getPasswordHint = () => {
    switch (role) {
      case 'student':  return 'Default password is your roll number';
      case 'lecturer': return 'Default password is your employee ID';
      default:         return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login({ role, username, password });
      switch (response.user.role) {
        case 'admin':    navigate('/admin/dashboard');   break;
        case 'student':  navigate('/student/dashboard'); break;
        case 'lecturer': navigate('/faculty/dashboard'); break;
        default:         navigate('/');
      }
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Please ensure the server is running.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordHint = getPasswordHint();

  const inputCls = "w-full px-4 py-2.5 bg-cream border border-pine-200 rounded-lg text-pine-800 placeholder-pine-300 focus:outline-none focus:ring-2 focus:ring-pine-400 transition";
  const labelCls = "block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-cream-50 border border-pine-100 rounded-2xl shadow-lg p-8"
             style={{ backgroundColor: '#fffef5' }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-pine-700 rounded-full mb-4">
              <GraduationCap className="w-7 h-7 text-cream" />
            </div>
            <h1 className="text-3xl font-bold text-pine-700 tracking-wide">Learnify</h1>
            <p className="text-pine-400 text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Banners */}
          {serverDown && (
            <div className="mb-4 p-3 bg-pine-50 border border-pine-200 rounded-lg flex items-center gap-2 text-pine-700 text-sm">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              Server is offline. Please start the server and try again.
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role */}
            <div>
              <label className={labelCls}>Login As</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => { setRole(e.target.value); setUsername(''); setPassword(''); setError(''); }}
                  required
                  className={inputCls + ' appearance-none'}
                >
                  <option value="">Select Role</option>
                  <option value="student">Student</option>
                  <option value="lecturer">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-pine-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {role && (
              <>
                <div>
                  <label className={labelCls}>{getUsernameLabel()}</label>
                  <input
                    type={role === 'admin' ? 'email' : 'text'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className={inputCls}
                    placeholder={getUsernamePlaceholder()}
                  />
                </div>

                <div>
                  <label className={labelCls}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputCls}
                    placeholder="Enter password"
                  />
                  {passwordHint && (
                    <p className="text-xs text-pine-400 mt-1">{passwordHint}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-pine-700 text-cream py-2.5 rounded-full hover:bg-pine-800 transition font-semibold text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cream" />
                  ) : (
                    <>Sign In <ArrowRight size={16} /></>
                  )}
                </button>
              </>
            )}
          </form>

          <p className="text-center text-sm text-pine-500 mt-6">
            New user?{' '}
            <Link to="/" className="text-pine-700 font-semibold hover:text-pine-800 underline underline-offset-2">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
