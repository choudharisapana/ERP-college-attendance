// frontend/src/pages/Register.jsx - Add this state and update handleSubmit
import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    department: '',
    semester: '',
    adminKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 🔥 NEW STATE
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { register, resendVerification } = useAuth();
  const navigate = useNavigate();

  // Departments array (same as before)
  const departments = [
    "Computer Science Engineering",
    "Information Technology",
    "Computer Technology",
    "Industrial-IOT",
    "Artificial Intelligence",
    "Civil Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Robotics"
  ];

  // Semesters array (same as before)
  const semesters = [
    "Semester 1", "Semester 2", "Semester 3", "Semester 4",
    "Semester 5", "Semester 6", "Semester 7", "Semester 8"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'role') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        department: value === 'admin' ? '' : prev.department,
        semester: value === 'admin' ? '' : prev.semester
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (error) setError('');
    // Hide verification message when user starts typing again
    if (showVerificationMessage) setShowVerificationMessage(false);
  };

  // 🔥 Handle resend verification
  const handleResendVerification = async () => {
    try {
      const result = await resendVerification(registeredEmail);
      if (result.success) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        alert(result.message || 'Failed to resend verification email');
      }
    } catch (error) {
      alert('Failed to resend verification email');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.role === 'user') {
      if (!formData.department) {
        setError('Please select a department for user account');
        setLoading(false);
        return;
      }

      if (!formData.semester) {
        setError('Please select a semester for user account');
        setLoading(false);
        return;
      }

      if (formData.role === "user" && !departments.includes(formData.department)) {
        setError("Invalid department selected");
        setLoading(false);
        return;
      }
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.role === 'user' ? formData.department : undefined,
        semester: formData.role === 'user' ? formData.semester : undefined,
        adminKey: formData.adminKey.trim()
      };

      console.log("Registering user:", userData);

      const result = await register(userData);

      if (result.success) {
        if (result.requiresVerification) {
          // 🔥 Show verification message instead of auto-login
          setRegisteredEmail(result.email);
          setShowVerificationMessage(true);
          // Reset form
          setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'user',
            department: '',
            semester: '',
            adminKey: ''
          });
        } else {
          // Old flow - direct login
          navigate('/dashboard');
        }
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Join EduScheduler and start scheduling
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          {/* 🔥 VERIFICATION SUCCESS MESSAGE */}
          {showVerificationMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                    Registration Successful! 🎉
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                    <p>Please check your email <strong>{registeredEmail}</strong> to verify your account.</p>
                    <p className="mt-2">
                      Didn't receive email?{' '}
                      <button 
                        onClick={handleResendVerification}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Click here to resend
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && !showVerificationMessage && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
              <i className="fas fa-exclamation-circle text-red-500 dark:text-red-400 mr-3"></i>
              <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* FORM - Hide form when showing verification message */}
          {!showVerificationMessage && (
            <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-user text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="new-email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your email (Gmail or College email only)"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Only @gmail.com and @college.edu emails are allowed
                </p>
              </div>

              {/* Role Field */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-user-tag text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="user">User (Student)</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400 dark:text-gray-500"></i>
                  </div>
                </div>
              </div>

              {/* Department & Semester Fields - Only for user role */}
              {formData.role === 'user' && (
                <>
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fas fa-building text-gray-400 dark:text-gray-500"></i>
                      </div>
                      <select
                        id="department"
                        name="department"
                        required
                        value={formData.department}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Semester *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fas fa-graduation-cap text-gray-400 dark:text-gray-500"></i>
                      </div>
                      <select
                        id="semester"
                        name="semester"
                        required
                        value={formData.semester}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Semester</option>
                        {semesters.map((sem) => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Admin Key - Only for admin role */}
              {formData.role === 'admin' && (
                <>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <i className="fas fa-info-circle mr-2"></i>
                      Administrator accounts manage all departments and semesters.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Admin Secret Key
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fas fa-key text-gray-400"></i>
                      </div>
                      <input
                        type="password"
                        name="adminKey"
                        autoComplete="new-password"
                        required
                        placeholder="Enter admin key"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={formData.adminKey}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Must be at least 6 characters</p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus mr-2"></i>
                    Create Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* Login Link - Show even after verification message */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {showVerificationMessage ? 'Already verified?' : 'Already have an account?'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to={showVerificationMessage ? "/login" : "/login"}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors"
            >
              {showVerificationMessage ? 'Sign in to your account' : 'Sign in to your account'}
              <i className="fas fa-arrow-right ml-2 text-sm"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;