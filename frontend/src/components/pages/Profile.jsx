// frontend/src/components/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    department: '',
    semester: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        semester: user.semester || ''
      });
    }
  }, [user]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    clearMessages();
  };

  const clearMessages = () => {
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!passwordData.currentPassword) {
      setError('Current password is required');
      setLoading(false);
      return;
    }

    if (!passwordData.newPassword) {
      setError('New password is required');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('New password must be different from current password');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('✅ Password changed successfully! Please login again.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setError('An error occurred while changing password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'faculty': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return 'fa-crown';
      case 'faculty': return 'fa-chalkboard-teacher';
      default: return 'fa-graduation-cap';
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Administrator';
      case 'faculty': return 'Faculty';
      default: return 'Student';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
          <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Manage your account information and security
          </p>
        </div>
         
        

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-24">
              {/* Profile Summary */}
              <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
                  <span className="text-white text-2xl font-bold">
                    {getInitials(user.name)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  {user.name || 'User'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {user.email || 'No email'}
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Active
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-2 space-y-0.5">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <i className={`fas fa-user w-4 text-center ${activeTab === 'profile' ? 'text-blue-500' : 'text-gray-400'}`}></i>
                  <span>Profile Information</span>
                </button>

                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'password'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <i className={`fas fa-lock w-4 text-center ${activeTab === 'password' ? 'text-blue-500' : 'text-gray-400'}`}></i>
                  <span>Change Password</span>
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                  <button
                    onClick={() => navigate('/forgot-password')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <i className="fas fa-key w-4 text-center text-gray-400"></i>
                    <span>Forgot Password?</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  >
                    <i className="fas fa-sign-out-alt w-4 text-center text-red-500"></i>
                    <span>Logout</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <i className="fas fa-exclamation-circle text-red-500 dark:text-red-400 mt-0.5"></i>
                  <div>
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 dark:text-green-400 mt-0.5"></i>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
                    {success.includes('Please login again') && (
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">Redirecting to login page...</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <i className="fas fa-id-card text-blue-600 dark:text-blue-400 text-sm"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Your account details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        <i className="fas fa-user text-gray-400 text-[10px]"></i>
                        Full Name
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {profileData.name || 'Not set'}
                      </p>
                    </div>

                    {/* Email */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        <i className="fas fa-envelope text-gray-400 text-[10px]"></i>
                        Email Address
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {profileData.email || 'Not set'}
                      </p>
                    </div>

                    {/* Department - Only for Students */}
                    {user.role === 'user' && (
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          <i className="fas fa-building text-gray-400 text-[10px]"></i>
                          Department
                        </label>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {profileData.department || 'Not set'}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Contact admin to change</p>
                      </div>
                    )}

                    {/* Semester - Only for Students */}
                    {user.role === 'user' && (
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          <i className="fas fa-graduation-cap text-gray-400 text-[10px]"></i>
                          Semester
                        </label>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {profileData.semester || 'Not set'}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Contact admin to change</p>
                      </div>
                    )}

                    {/* Role */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        <i className="fas fa-user-tag text-gray-400 text-[10px]"></i>
                        Account Type
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {getRoleLabel(user.role)}
                      </p>
                    </div>

                    {/* Account Created */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        <i className="fas fa-calendar-alt text-gray-400 text-[10px]"></i>
                        Member Since
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <i className="fas fa-key text-blue-600 dark:text-blue-400 text-sm"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Update your security credentials</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-info-circle text-amber-600 dark:text-amber-400 mt-0.5 text-sm"></i>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        After changing your password, you will be automatically logged out and need to login again.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-lock text-gray-400 dark:text-gray-500 text-sm"></i>
                        </div>
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                          placeholder="Enter your current password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fas fa-lock text-gray-400 dark:text-gray-500 text-sm"></i>
                          </div>
                          <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            required
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                            placeholder="Enter new password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum 6 characters</p>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fas fa-lock text-gray-400 dark:text-gray-500 text-sm"></i>
                          </div>
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                            placeholder="Confirm new password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-key"></i>
                        Change Password
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;