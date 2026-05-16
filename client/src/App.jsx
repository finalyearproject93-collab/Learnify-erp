import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCourses from './pages/admin/ManageCourses';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentMarks from './pages/student/StudentMarks';
import StudentProfile from './pages/student/StudentProfile';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import MarkAttendance from './pages/faculty/MarkAttendance';
import UploadMarks from './pages/faculty/UploadMarks';
import FacultyAttendanceReport from './pages/faculty/FacultyAttendanceReport';
import FacultySubjects from './pages/faculty/FacultySubjects';
import EnrollStudents from './pages/faculty/EnrollStudents';
import EditMarks from './pages/faculty/EditMarks';
import EditAttendance from './pages/faculty/EditAttendance';
import SendNotification from './pages/faculty/SendNotification';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'lecturer') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RoleBasedRedirect />} />

        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="courses" element={<ManageCourses />} />
        </Route>

        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="marks" element={<StudentMarks />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        <Route path="/faculty" element={<ProtectedRoute allowedRoles={['lecturer']}><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<FacultyDashboard />} />
          <Route path="subjects" element={<FacultySubjects />} />
          <Route path="enroll-students" element={<EnrollStudents />} />
          <Route path="mark-attendance" element={<MarkAttendance />} />
          <Route path="upload-marks" element={<UploadMarks />} />
          <Route path="edit-marks" element={<EditMarks />} />
          <Route path="edit-attendance" element={<EditAttendance />} />
          <Route path="attendance-report" element={<FacultyAttendanceReport />} />
          <Route path="notifications" element={<SendNotification />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
