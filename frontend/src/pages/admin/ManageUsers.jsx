import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { Users, Trash2, Plus, X, GraduationCap, User, Shield, UserPlus, Pencil } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [roleFilter, setRoleFilter] = useState('all');
  const [formData, setFormData] = useState({ role: 'student' });
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchUsers();
    api.get('/admin/courses').then(r => setCourses(r.data.courses || [])).catch(() => {});
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    const matchedCourse = courses.find(c => c.course_name === user.course_name);
    setEditData({
      full_name:   user.full_name,
      email:       user.email || '',
      phone:       user.phone || '',
      semester:    user.semester || '',
      roll_number: user.roll_number || '',
      employee_id: user.employee_id || '',
      course_id:   matchedCourse?.id || '',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    try {
      await api.put(`/admin/users/${editingUser.id}`, editData);
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/users', formData);
      setShowModal(false);
      setFormData({ role: 'student' });
      fetchUsers();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || 'Failed to create user');
    }
  };

  const filteredUsers = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'student':  return <GraduationCap className="w-3.5 h-3.5" />;
      case 'lecturer': return <User className="w-3.5 h-3.5" />;
      case 'admin':    return <Shield className="w-3.5 h-3.5" />;
      default:         return null;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'student':  return 'bg-pine-100 text-pine-700';
      case 'lecturer': return 'bg-pine-400 text-cream';
      case 'admin':    return 'bg-pine-700 text-cream';
      default:         return 'bg-pine-50 text-pine-600';
    }
  };

  const inputCls = "w-full px-4 py-2.5 bg-cream border border-pine-200 rounded-lg text-pine-800 placeholder-pine-300 focus:outline-none focus:ring-2 focus:ring-pine-400 transition";
  const labelCls = "block text-xs font-semibold text-pine-600 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-pine-800">Manage Users</h1>
        <button
          onClick={() => { setShowModal(true); setError(''); setFormData({ role: 'student' }); }}
          className="flex items-center gap-2 bg-pine-400 text-cream px-5 py-2.5 rounded-full hover:bg-pine-500 transition font-semibold text-sm tracking-wide shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2">
        {['all', 'student', 'lecturer', 'admin'].map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${
              roleFilter === r
                ? 'bg-pine-700 text-cream'
                : 'bg-cream border border-pine-200 text-pine-700 hover:bg-pine-50'
            }`}
          >
            {r === 'lecturer' ? 'Faculty' : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-cream border border-pine-100 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pine-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead style={{ backgroundColor: '#f5f2e0' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-pine-600 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-pine-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-pine-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-pine-900">{user.full_name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadge(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role === 'lecturer' ? 'Faculty' : user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-pine-600 font-mono">{user.roll_number || user.employee_id || '—'}</td>
                  <td className="px-6 py-4 text-sm text-pine-600">{user.course_name || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-pine-600 hover:bg-pine-100 transition"
                        title="Edit user"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-16 text-pine-400">No users found</div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-pine-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-cream border border-pine-100 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-pine-100">
              <h2 className="text-lg font-bold text-pine-800">Add New User</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-pine-100 text-pine-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role */}
                <div>
                  <label className={labelCls}>Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ role: e.target.value })}
                    className={inputCls}
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Full Name */}
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input
                    type="text" required
                    value={formData.full_name || ''}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className={inputCls}
                    placeholder="Enter full name"
                  />
                </div>

                {/* Student fields */}
                {formData.role === 'student' && (
                  <>
                    <div>
                      <label className={labelCls}>Roll Number</label>
                      <input
                        type="text" required
                        value={formData.roll_number || ''}
                        onChange={e => setFormData({ ...formData, roll_number: e.target.value })}
                        className={inputCls}
                        placeholder="e.g., E26001"
                      />
                      <p className="text-xs text-pine-400 mt-1">Must be unique — duplicate roll numbers are not allowed</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Course</label>
                        <select
                          required
                          value={formData.course_id || ''}
                          onChange={e => setFormData({ ...formData, course_id: e.target.value })}
                          className={inputCls}
                        >
                          <option value="">Select Course</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.course_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Semester <span className="text-red-500">*</span></label>
                        <select
                          required
                          value={formData.semester || ''}
                          onChange={e => setFormData({ ...formData, semester: e.target.value })}
                          className={inputCls}
                        >
                          <option value="" disabled>Select Semester</option>
                          {[1,2,3,4,5,6,7,8].map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Email (optional)</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className={inputCls}
                        placeholder="student@example.com"
                      />
                    </div>
                  </>
                )}

                {/* Faculty fields */}
                {formData.role === 'lecturer' && (
                  <>
                    <div>
                      <label className={labelCls}>Employee ID</label>
                      <input
                        type="text" required
                        value={formData.employee_id || ''}
                        onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                        className={inputCls}
                        placeholder="e.g., EMP001"
                      />
                      <p className="text-xs text-pine-400 mt-1">Must be unique — duplicate employee IDs are not allowed</p>
                    </div>
                    <div>
                      <label className={labelCls}>Email (optional)</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className={inputCls}
                        placeholder="faculty@example.com"
                      />
                    </div>
                  </>
                )}

                {/* Admin fields */}
                {formData.role === 'admin' && (
                  <>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input
                        type="email" required
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className={inputCls}
                        placeholder="admin@example.com"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Password</label>
                      <input
                        type="password" required
                        value={formData.password || ''}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className={inputCls}
                        placeholder="Set password"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-full border border-pine-300 text-pine-700 text-sm font-semibold hover:bg-pine-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-full bg-pine-700 text-cream text-sm font-semibold hover:bg-pine-800 transition"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-pine-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-cream border border-pine-100 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-pine-100">
              <div>
                <h2 className="text-lg font-bold text-pine-800">Edit User</h2>
                <p className="text-xs text-pine-500 mt-0.5">{editingUser.full_name} · {editingUser.role}</p>
              </div>
              <button onClick={() => setShowEditModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-pine-100 text-pine-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {editError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{editError}</div>
              )}
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input type="text" required value={editData.full_name || ''}
                    onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                    className={inputCls} />
                </div>

                {editingUser.role === 'student' && (
                  <>
                    <div>
                      <label className={labelCls}>Roll Number</label>
                      <input type="text" value={editData.roll_number || ''}
                        onChange={e => setEditData({ ...editData, roll_number: e.target.value })}
                        className={inputCls} placeholder="e.g., E26001" />
                      <p className="text-xs text-pine-400 mt-1">Leave blank to keep current roll number</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Course</label>
                        <select value={editData.course_id || ''}
                          onChange={e => setEditData({ ...editData, course_id: e.target.value })}
                          className={inputCls}>
                          <option value="">— No change —</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.course_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Semester</label>
                        <select value={editData.semester || ''}
                          onChange={e => setEditData({ ...editData, semester: e.target.value })}
                          className={inputCls}>
                          <option value="">— No change —</option>
                          {[1,2,3,4,5,6,7,8].map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {editingUser.role === 'lecturer' && (
                  <>
                    <div>
                      <label className={labelCls}>Employee ID</label>
                      <input type="text" value={editData.employee_id || ''}
                        onChange={e => setEditData({ ...editData, employee_id: e.target.value })}
                        className={inputCls} placeholder="e.g., EMP001" />
                      <p className="text-xs text-pine-400 mt-1">Leave blank to keep current employee ID</p>
                    </div>
                    <div>
                      <label className={labelCls}>Course</label>
                      <select value={editData.course_id || ''}
                        onChange={e => setEditData({ ...editData, course_id: e.target.value })}
                        className={inputCls}>
                        <option value="">— No course assigned —</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.course_name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-pine-400 mt-1">Faculty will only see subjects from this course</p>
                    </div>
                  </>
                )}

                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={editData.email || ''}
                    onChange={e => setEditData({ ...editData, email: e.target.value })}
                    className={inputCls} placeholder="Email address" />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" value={editData.phone || ''}
                    onChange={e => setEditData({ ...editData, phone: e.target.value })}
                    className={inputCls} placeholder="Phone number" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 rounded-full border border-pine-300 text-pine-700 text-sm font-semibold hover:bg-pine-50 transition">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-full bg-pine-700 text-cream text-sm font-semibold hover:bg-pine-800 transition">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
