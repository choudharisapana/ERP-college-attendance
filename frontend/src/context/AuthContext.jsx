// import React, { createContext, useContext, useEffect, useState } from "react";
// import api from "../services/api";

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within AuthProvider");
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const loadUser = async () => {
//     try {
//       const res = await api.get("/auth/me");
//       setUser(res.data.user);
//     } catch (err) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ LOGIN (Updated to match your Login.jsx expectation)
//   const login = async (email, password) => {
//     try {
//       const response = await api.post("/auth/login", { email, password });
      
//       console.log("Login response:", response.data);
      
//       if (response.data.success) {
//         const { token, user } = response.data;
        
//         // Store in localStorage
//         localStorage.setItem("token", token);
//         localStorage.setItem("user", JSON.stringify(user));
        
//         // Update state
//         setUser(user);
        
//         return { 
//           success: true, 
//           user, 
//           token 
//         };
//       }
      
//       return { 
//         success: false, 
//         message: response.data.message 
//       };
      
//     } catch (error) {
//       console.error("Login error:", error);
      
//       return { 
//         success: false, 
//         message: error.response?.data?.message || "Login failed" 
//       };
//     }
//   };

//   // ✅ REGISTER (Updated)
//   const register = async (userData) => {
//     try {
//       const response = await api.post('/auth/register', userData);
      
//       console.log("Register response:", response.data);
      
//       if (response.data.success) {
//         const { token, user } = response.data;
        
//         // Store in localStorage
//         localStorage.setItem('token', token);
//         localStorage.setItem('user', JSON.stringify(user));
        
//         // Update state
//         setUser(user);
        
//         return { 
//           success: true,
//           user,
//           token
//         };
//       }
      
//       return { 
//         success: false, 
//         message: response.data.message 
//       };
      
//     } catch (error) {
//       console.error('Registration error:', error);
//       return {
//         success: false, 
//         message: error.response?.data?.message || 'Registration failed'
//       };
//     }
//   };

//   // ✅ UPDATE PROFILE (New function)
//   const updateProfile = async (profileData) => {
//     try {
//       // Update only name and email (department and semester are read-only for users)
//       const updateData = {
//         name: profileData.name,
//         email: profileData.email
//       };
      
//       const response = await api.put('/users/profile', updateData);
      
//       console.log("Update profile response:", response.data);
      
//       if (response.data.success) {
//         const updatedUser = response.data.user;
        
//         // Update state
//         setUser(updatedUser);
        
//         // Update localStorage
//         localStorage.setItem('user', JSON.stringify(updatedUser));
        
//         return { 
//           success: true,
//           user: updatedUser,
//           message: response.data.message || 'Profile updated successfully'
//         };
//       }
      
//       return { 
//         success: false, 
//         message: response.data.message 
//       };
      
//     } catch (error) {
//       console.error('Update profile error:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to update profile'
//       };
//     }
//   };

//   // ✅ CHANGE PASSWORD (New function)
//   const changePassword = async (passwordData) => {
//     try {
//       const response = await api.put('/users/change-password', passwordData);
      
//       console.log("Change password response:", response.data);
      
//       if (response.data.success) {
//         return { 
//           success: true,
//           message: response.data.message || 'Password changed successfully'
//         };
//       }
      
//       return { 
//         success: false, 
//         message: response.data.message 
//       };
      
//     } catch (error) {
//       console.error('Change password error:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to change password'
//       };
//     }
//   };

//   // ✅ LOGOUT
//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setUser(null);
//   };

//   // ✅ CHECK IF USER IS AUTHENTICATED
//   const isAuthenticated = () => {
//     return !!localStorage.getItem("token");
//   };

//   // ✅ GET USER ROLE
//   const getUserRole = () => {
//     return user?.role;
//   };

//   // ✅ IS ADMIN CHECK
//   const isAdmin = () => {
//     return user?.role === 'admin';
//   };

//   // ✅ IS USER CHECK
//   const isUser = () => {
//     return user?.role === 'user';
//   };

//   // ✅ GET USER DEPARTMENT
//   const getUserDepartment = () => {
//     return user?.department;
//   };

//   // ✅ GET USER SEMESTER
//   const getUserSemester = () => {
//     return user?.semester;
//   };

//   useEffect(() => {
//     if (localStorage.getItem("token")) {
//       loadUser();
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         setUser,
//         login,
//         register,
//         updateProfile,
//         changePassword,
//         logout,
//         loading,
//         isAuthenticated,
//         getUserRole,
//         isAdmin,
//         isUser,
//         getUserDepartment,
//         getUserSemester
//       }}
//     >
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    // Initialize auth from stored token
    authService.initializeAuth();
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      const result = await authService.registerUser(userData);
      
      if (result.success) {
        if (result.requiresVerification) {
          // Show verification message, don't auto-login
          setVerificationRequired(true);
          setPendingEmail(result.email);
          return {
            success: true,
            requiresVerification: true,
            email: result.email,
            message: result.message
          };
        } else {
          // Old flow - auto login
          setUser(result.user);
          return {
            success: true,
            user: result.user
          };
        }
      }
      
      return {
        success: false,
        message: result.message
      };
    } catch (error) {
      console.error('Registration error in context:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  };

  const login = async (email, password) => {
    try {
      const result = await authService.loginUser(email, password);
      
      if (result.success) {
        setUser(result.user);
        setVerificationRequired(false);
        setPendingEmail('');
        return {
          success: true,
          user: result.user
        };
      }
      
      // Check if verification is required
      if (result.requiresVerification) {
        setVerificationRequired(true);
        setPendingEmail(result.email);
        return {
          success: false,
          requiresVerification: true,
          email: result.email,
          message: result.message
        };
      }
      
      return {
        success: false,
        message: result.message
      };
    } catch (error) {
      console.error('Login error in context:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    authService.logoutUser();
    setUser(null);
    setVerificationRequired(false);
    setPendingEmail('');
  };

  const verifyEmail = async (token) => {
    const result = await authService.verifyEmail(token);
    return result;
  };

  const resendVerification = async (email) => {
    const result = await authService.resendVerificationEmail(email);
    return result;
  };

  const value = {
    user,
    loading,
    verificationRequired,
    pendingEmail,
    register,
    login,
    logout,
    verifyEmail,
    resendVerification,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};