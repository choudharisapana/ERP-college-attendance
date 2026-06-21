// frontend/src/pages/Login.jsx - Add verification handling
import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 🔥 NEW STATE
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (showVerificationAlert) setShowVerificationAlert(false);
  };

  // 🔥 Handle resend verification
  const handleResendVerification = async () => {
    try {
      const result = await resendVerification(verificationEmail);
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
    setShowVerificationAlert(false);

    try {
      const result = await login(formData.email, formData.password);
      
      console.log("Login result:", result);
      
      if (result && result.success) {
        navigate('/dashboard');
      } else if (result && result.requiresVerification) {
        // 🔥 Show verification alert
        setShowVerificationAlert(true);
        setVerificationEmail(result.email);
        setError('');
      } else {
        setError(result?.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error("Login catch error:", error);
      setError('An error occurred during login');
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
            Login
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to your EduScheduler account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          {/* 🔥 VERIFICATION REQUIRED ALERT */}
          {showVerificationAlert && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Email Not Verified
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                    <p>Please verify your email address before logging in.</p>
                    <p className="mt-1">
                      Didn't receive email?{' '}
                      <button 
                        onClick={handleResendVerification}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Resend Verification Email
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && !showVerificationAlert && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
              <i className="fas fa-exclamation-circle text-red-500 dark:text-red-400 mr-3"></i>
              <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

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
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter your password"
                  value={formData.password}
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
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">New to EduScheduler?</span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Create an account
              <i className="fas fa-arrow-right ml-2 text-sm"></i>
            </Link>
          </div>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium transition-colors"
            >
              <i className="fas fa-key mr-1"></i>
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;