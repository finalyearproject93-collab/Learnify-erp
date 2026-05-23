import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { UserCircle, Mail, BookOpen, Hash, GraduationCap } from 'lucide-react';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/student/profile');
      setProfile(response.data.student);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-12 text-gray-500">Profile not found</div>;
  }

  const fields = [
    { label: 'Full Name',   value: profile.full_name,                                        icon: UserCircle },
    { label: 'Roll Number', value: profile.roll_number,                                       icon: Hash },
    { label: 'Course',      value: profile.course_name,                                       icon: GraduationCap },
    { label: 'Year',        value: profile.year ? `Year ${profile.year}` : null,              icon: BookOpen },
    { label: 'Semester',    value: profile.semester ? `Semester ${profile.semester}` : null,  icon: BookOpen },
    { label: 'Email',       value: profile.email,                                             icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        {/* Avatar + name header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <UserCircle className="w-10 h-10 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
            <p className="text-gray-500 text-sm">
              {profile.course_name || 'Student'}
              {profile.year ? ` · Year ${profile.year}` : ''}
              {profile.semester ? ` · Sem ${profile.semester}` : ''}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              {profile.roll_number}
            </span>
          </div>
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field, index) => {
            const Icon = field.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{field.label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {field.value || <span className="text-gray-400 font-normal">Not provided</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
