import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, User, Shield, ArrowRight, CheckCircle, Eye, EyeOff, WifiOff } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { serverDown } = useAuth();
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({});
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  // Fetch courses when student role is selected
  useEffect(() => {
    if (role === 'student') {
      api.get('/auth/courses')
        .then(res => setCourses(res.data.courses || []))
        .catch(() => setCourses([]));
    }
  }, [role]);

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setFormData({});
    setError('');
    setSuccess('');
    setRegisteredUser(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateRollNumber = (roll) => {
    const regex = /^E\d{2}\d{3}$/;
    return regex.test(roll);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (role === 'student' && formData.roll_number && !validateRollNumber(formData.roll_number)) {
      setError('Invalid roll number format. Use: E + 2-digit year + 3-digit number (e.g., E26001)');
      setLoading(false);
      return;
    }

    const payload = { role, ...formData };

    try {
      const response = await api.post('/auth/register', payload);
      setSuccess(response.data.message);
      setRegisteredUser(response.data.user);
      setFormData({});
      setRole('');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Please ensure the server is running.');
      } else {
        // Handle both { message: "..." } and { errors: [...] } response shapes
        const data = err.response?.data;
        if (data?.errors?.length) {
          setError(data.errors.map(e => e.msg).join(', '));
        } else {
          setError(data?.message || data?.error || 'Registration failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const renderRoleFields = () => {
    switch (role) {
      case 'student':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" name="full_name" required value={formData.full_name || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Enter full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Roll Number</label>
              <input type="text" name="roll_number" required value={formData.roll_number || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="e.g., E26001" />
              <p className="text-xs text-charcoal-400 mt-1">Format: E + 2-digit year + 3-digit number (e.g., E26001)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Course</label>
                <select name="course_id" required value={formData.course_id || ''} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Semester</label>
                <select name="semester" required value={formData.semester || ''} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Email (optional)</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Email address" />
            </div>
            {formData.roll_number && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <p className="text-sm text-charcoal-700 font-medium">Auto-generated Password</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-beige px-2 py-1 rounded text-charcoal-800 font-mono">{formData.roll_number}</code>
                  <span className="text-xs text-charcoal-500">(same as roll number)</span>
                </div>
              </div>
            )}
          </>
        );

      case 'lecturer':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" name="full_name" required value={formData.full_name || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Enter full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Employee ID</label>
              <input type="text" name="employee_id" required value={formData.employee_id || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Employee ID" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Email (optional)</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Email address" />
            </div>
            {formData.employee_id && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <p className="text-sm text-charcoal-700 font-medium">Auto-generated Password</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-beige px-2 py-1 rounded text-charcoal-800 font-mono">{formData.employee_id}</code>
                  <span className="text-xs text-charcoal-500">(same as employee ID)</span>
                </div>
              </div>
            )}
          </>
        );

      case 'admin':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" name="full_name" required value={formData.full_name || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Enter full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" name="email" required value={formData.email || ''} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password || ''} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-300 pr-10"
                  placeholder="Set password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-charcoal-400 hover:text-charcoal-700">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'student': return <GraduationCap className="w-5 h-5" />;
      case 'lecturer': return <User className="w-5 h-5" />;
      case 'admin': return <Shield className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-beige-light rounded-2xl border border-beige-dark shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-charcoal-800 rounded-full mb-4">
              <GraduationCap className="w-6 h-6 text-beige-light" />
            </div>
            <h1 className="text-2xl font-semibold text-charcoal-900 tracking-wide">Learnify</h1>
            <p className="text-charcoal-500 text-sm mt-1">Create your account</p>
          </div>

          {serverDown && (
            <div className="mb-4 p-3 bg-primary-100 border border-primary-300 rounded-lg flex items-center gap-2 text-charcoal-700 text-sm">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              Server is offline. Please start the server and try again.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {success && registeredUser && (
            <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-charcoal-700" />
                <span className="text-charcoal-800 font-medium">{success}</span>
              </div>
              <div className="text-sm text-charcoal-700 space-y-1">
                <p><strong>Name:</strong> {registeredUser.full_name}</p>
                {registeredUser.roll_number && <p><strong>Roll Number:</strong> {registeredUser.roll_number}</p>}
                {registeredUser.employee_id && <p><strong>Employee ID:</strong> {registeredUser.employee_id}</p>}
                <p><strong>Password:</strong> <code className="bg-beige px-1 rounded">{registeredUser.password}</code></p>
              </div>
              <button onClick={() => navigate('/login')}
                className="mt-3 w-full bg-charcoal-800 text-beige-light py-2 rounded-full hover:bg-charcoal-900 transition text-sm font-medium uppercase tracking-wide">
                Go to Login
              </button>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal-600 uppercase tracking-wider mb-1.5">Register As</label>
                <div className="relative">
                  <select value={role} onChange={handleRoleChange} required
                    className="w-full px-4 py-2.5 bg-beige border border-beige-dark rounded-lg text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none">
                    <option value="">Select Role</option>
                    <option value="student">Student</option>
                    <option value="lecturer">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-charcoal-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {renderRoleFields()}

              {role && (
                <button type="submit" disabled={loading}
                  className="w-full bg-charcoal-800 text-beige-light py-2.5 rounded-full hover:bg-charcoal-900 transition font-medium text-sm tracking-wide uppercase flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-beige-light"></div>
                  ) : (
                    <>Register <ArrowRight size={16} /></>
                  )}
                </button>
              )}
            </form>
          )}

          {!success && (
            <p className="text-center text-sm text-charcoal-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-charcoal-800 hover:text-charcoal-900 font-medium underline underline-offset-2">Login here</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
