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

  // Role check (admin bypass)
  if (role && user.role !== role && user.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;