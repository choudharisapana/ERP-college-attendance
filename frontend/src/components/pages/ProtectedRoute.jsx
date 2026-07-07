import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role) {
    if (Array.isArray(role)) {
      if (!role.includes(user.role) && user.role !== "admin") {
        return <Navigate to="/dashboard" />;
      }
    } 
    else {
      if (user.role !== role && user.role !== "admin") {
        return <Navigate to="/dashboard" />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;