// frontend/src/services/authService.js
import api from './api';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Helper functions
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
  }
};

const setUserData = (user) => {
  if (user) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_DATA_KEY);
  }
};

const getUserData = () => {
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
};

// Register user
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    
    if (response.data.success) {
      // Check if verification is required
      if (response.data.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          email: response.data.email,
          message: response.data.message
        };
      }
      
      // If no verification required (old flow), set token
      if (response.data.token) {
        setAuthToken(response.data.token);
        setUserData(response.data.user);
      }
      
      return {
        success: true,
        requiresVerification: false,
        user: response.data.user,
        token: response.data.token
      };
    }
    
    return {
      success: false,
      message: response.data.message || 'Registration failed'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed. Please try again.'
    };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.success) {
      setAuthToken(response.data.token);
      setUserData(response.data.user);
      
      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      };
    }
    
    return {
      success: false,
      message: response.data.message || 'Login failed'
    };
  } catch (error) {
    console.error('Login error:', error);
    
    // Check if it's a verification required error
    if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
      return {
        success: false,
        requiresVerification: true,
        email: error.response?.data?.email,
        message: error.response?.data?.message || 'Please verify your email before logging in.'
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed. Please check your credentials.'
    };
  }
};

// Verify email
export const verifyEmail = async (token) => {
  try {
    const response = await api.get(`/auth/verify-email/${token}`);
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Email verification failed'
    };
  }
};

// Resend verification email
export const resendVerificationEmail = async (email) => {
  try {
    const response = await api.post('/auth/resend-verification', { email });
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Resend verification error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to resend verification email'
    };
  }
};

// Logout user
export const logoutUser = () => {
  setAuthToken(null);
  setUserData(null);
};

// Get current user
export const getCurrentUser = () => {
  return getUserData();
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return !!token;
};

// Get auth token
export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

// Initialize auth from stored token
export const initializeAuth = () => {
  const token = getAuthToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return true;
  }
  return false;
};