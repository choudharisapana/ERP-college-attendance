import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('aartithakur5991@gmail.com'); // Pre-filled as in your example
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('Failed to send reset email'); // Initial error state
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setSuccess(result.message);
        setEmail('');
        setError(''); // Clear error on success
      } else {
        setError(result.message || 'Failed to send reset email');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-lock text-white text-lg"></i>
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-800">SecureApp</h1>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot Password
          </h2>
          <p className="text-gray-600">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          {/* Error Message - Always show if error exists */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <i className="fas fa-exclamation-circle text-red-500 mt-0.5 mr-3"></i>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <i className="fas fa-check-circle text-green-500 mt-0.5 mr-3"></i>
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    error 
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>
              {/* Error hint below email field */}
              {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <i className="fas fa-exclamation-triangle mr-1 text-xs"></i> 
                  Please verify your email address
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center pt-4 border-t border-gray-200">
            <Link
              to="/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              <i className="fas fa-arrow-left mr-2 text-sm"></i>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;