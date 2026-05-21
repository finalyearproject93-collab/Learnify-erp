import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight, CheckCircle, Eye, EyeOff, WifiOff } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { serverDown } = useAuth();
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({});
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

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

  const validateRollNumber = (roll) => /^E\d{2}\d{3}$/.test(roll);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (role === 'student' && formData.roll_number && !validateRollNumber(formData.roll_number)) {
      setError('Invalid roll number format. Use: E + 2-digit year + 3-digit number (e.g., E26001)');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', { role, ...formData });
      setSuccess(response.data.message);
      setRegisteredUser(response.data.user);
      setFormData({});
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Please ensure the server is running.');
      } else {
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

  // Shared input / label classes
  const inputCls = "w-full px-4 py-2.5 bg-cream border border-pine-200 rounded-lg text-pine-800 placeholder-pine-300 focus:outline-none focus:ring-2 focus:ring-pine-400 transition";
  const labelCls = "block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5";

  const renderRoleFields = () => {
    switch (role) {
      case 'student':
        return (
          <>
            <div>
              <label className={labelCls}>Full Name</label>
              <input type="text" name="full_name" required value={formData.full_name || ''} onChange={handleChange}
                className={inputCls} placeholder="Enter full name" />
            </div>
            <div>
              <label className={labelCls}>Roll Number</label>
              <input type="text" name="roll_number" required value={formData.roll_number || ''} onChange={handleChange}
                className={inputCls} placeholder="Enter your Roll No..." />
             
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Course</label>
                <select name="course_id" required value={formData.course_id || ''} onChange={handleChange}
                  className={inputCls}>
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Semester</label>
                <select name="semester" required value={formData.semester || ''} onChange={handleChange}
                  className={inputCls}>
                  <option value="">Select</option>
                  {[1,2,3,4,5,6].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        );

      case 'lecturer':
        return (
          <>
            <div>
              <label className={labelCls}>Full Name</label>
              <input type="text" name="full_name" required value={formData.full_name || ''} onChange={handleChange}
                className={inputCls} placeholder="Enter full name" />
            </div>
            <div>
              <label className={labelCls}>Employee ID</label>
              <input type="text" name="employee_id" required value={formData.employee_id || ''} onChange={handleChange}
                className={inputCls} placeholder="Employee ID" />
            </div>
            <div>
              <label className={labelCls}>Email (optional)</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange}
                className={inputCls} placeholder="Email address" />
            </div>
            
          </>
        );

      case 'admin':
        return (
          <>
            <div>
              <label className={labelCls}>Full Name</label>
              <input type="text" name="full_name" required value={formData.full_name || ''} onChange={handleChange}
                className={inputCls} placeholder="Enter full name" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" name="email" required value={formData.email || ''} onChange={handleChange}
                className={inputCls} placeholder="admin@example.com" />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password || ''} onChange={handleChange}
                  className={inputCls + ' pr-10'} placeholder="Set password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-pine-400 hover:text-pine-700">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="border border-pine-100 rounded-2xl shadow-lg p-8" style={{ backgroundColor: '#fffef5' }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-pine-700 rounded-full mb-4">
              <GraduationCap className="w-7 h-7 text-cream" />
            </div>
            <h1 className="text-3xl font-bold text-pine-700 tracking-wide">Learnify</h1>
            <p className="text-pine-400 text-sm mt-1">Create your account</p>
          </div>

          {/* Banners */}
          {serverDown && (
            <div className="mb-4 p-3 bg-pine-50 border border-pine-200 rounded-lg flex items-center gap-2 text-pine-700 text-sm">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              Server is offline. Please start the server and try again.
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* Success */}
          {success && registeredUser && (
            <div className="mb-4 p-4 bg-pine-50 border border-pine-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-pine-600" />
                <span className="text-pine-800 font-semibold">{success}</span>
              </div>
              <div className="text-sm text-pine-700 space-y-1">
                <p><strong>Name:</strong> {registeredUser.full_name}</p>
                {registeredUser.roll_number && <p><strong>Roll Number:</strong> {registeredUser.roll_number}</p>}
                {registeredUser.employee_id && <p><strong>Employee ID:</strong> {registeredUser.employee_id}</p>}
                <p><strong>Password:</strong> <code className="bg-cream px-1 rounded border border-pine-200">{registeredUser.password}</code></p>
              </div>
              <button onClick={() => navigate('/login')}
                className="mt-3 w-full bg-pine-700 text-cream py-2 rounded-full hover:bg-pine-800 transition text-sm font-semibold uppercase tracking-widest">
                Go to Login
              </button>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Register As</label>
                <div className="relative">
                  <select value={role} onChange={handleRoleChange} required className={inputCls + ' appearance-none'}>
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

              {renderRoleFields()}

              <button type="submit" disabled={loading}
                className="w-full bg-pine-700 text-cream py-2.5 rounded-full hover:bg-pine-800 transition font-semibold text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cream" />
                ) : (
                  <>Register <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}

          {!success && (
            <p className="text-center text-sm text-pine-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-pine-700 font-semibold hover:text-pine-800 underline underline-offset-2">
                Login here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
