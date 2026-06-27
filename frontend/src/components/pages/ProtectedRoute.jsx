// frontend/src/components/pages/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // Not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // ✅ Role check with multiple roles support
  if (role) {
    // Agar multiple roles array mein hain
    if (Array.isArray(role)) {
      if (!role.includes(user.role) && user.role !== "admin") {
        return <Navigate to="/dashboard" />;
      }
    } 
    // Agar single role hai
    else {
      if (user.role !== role && user.role !== "admin") {
        return <Navigate to="/dashboard" />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;