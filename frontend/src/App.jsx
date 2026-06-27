// frontend/src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import ForgotPassword from "./components/pages/ForgotPassword";
import ResetPassword from "./components/pages/ResetPassword";

import Dashboard from "./components/pages/Dashboard";
import CreateTimetable from "./components/pages/CreateTimetable";
import Subject from "./components/pages/Subject";
import Profile from "./components/pages/Profile";
import Faculty from "./components/pages/Faculty";
import Classroom from "./components/pages/Classroom";
import StudentBatches from "./components/pages/StudentBatches";
import Settings from "./components/pages/Settings";
import Suggestions from "./components/pages/Suggestions";
import Contact from "./components/pages/Contact";
import VerifyEmail from "./components/pages/VerifyEmail";
import ProtectedRoute from "./components/pages/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import { SuggestionProvider } from "./context/SuggestionContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import ChangePassword from './components/pages/ChangePassword';

// ✅ Faculty Leave - Only if needed
// import FacultyLeave from "./components/pages/FacultyLeave";

// ✅ Admin Leave Management - Only if needed
// import AdminLeaveManagement from "./components/pages/AdminLeaveManagement";

// Theme Manager Component
const ThemeManager = ({ children }) => {
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (!loading && settings) {
      const root = document.documentElement;
      const body = document.body;
      
      if (settings.theme === "dark") {
        root.classList.add("dark");
        root.style.backgroundColor = "#111827";
        body.style.backgroundColor = "#111827";
        body.style.color = "#f3f4f6";
      } else if (settings.theme === "light") {
        root.classList.remove("dark");
        root.style.backgroundColor = "#f9fafb";
        body.style.backgroundColor = "#f9fafb";
        body.style.color = "#111827";
      } else if (settings.theme === "auto") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (isDark) {
          root.classList.add("dark");
          root.style.backgroundColor = "#111827";
          body.style.backgroundColor = "#111827";
          body.style.color = "#f3f4f6";
        } else {
          root.classList.remove("dark");
          root.style.backgroundColor = "#f9fafb";
          body.style.backgroundColor = "#f9fafb";
          body.style.color = "#111827";
        }
      }
    }
  }, [settings, loading]);

  return <>{children}</>;
};

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-grow p-4">
        <Routes>
          {/* 🔹 HOME */}
          <Route path="/" element={<Home />} />

          {/* 🔹 AUTH */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" /> : <Register />}
          />

          {/* 🔹 PASSWORD */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* ✅ DASHBOARD - All Roles */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ✅ PROFILE - All Roles */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ✅ CHANGE PASSWORD - All Roles */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* ✅ STUDENT BATCHES - All Roles */}
          <Route
            path="/studentBatches"
            element={
              <ProtectedRoute>
                <StudentBatches />
              </ProtectedRoute>
            }
          />

          {/* ✅ SUBJECT - Faculty & Admin */}
          <Route
            path="/subject"
            element={
              <ProtectedRoute  role={["admin", "faculty"]}>
                <Subject />
              </ProtectedRoute>
            }
          />

          {/* ✅ CLASSROOMS - Faculty & Admin */}
          <Route
            path="/classrooms"
            element={
              <ProtectedRoute  role={["admin", "faculty"]}>
                <Classroom />
              </ProtectedRoute>
            }
          />

          {/* ✅ FACULTY - Faculty & Admin */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute  role={["admin", "faculty"]}>
                <Faculty />
              </ProtectedRoute>
            }
          />

          {/* ✅ CREATE TIMETABLE - Admin Only */}
        

          <Route
            path="/create-timetable"
            element={
              <ProtectedRoute  role={["admin", "faculty"]}>
                <CreateTimetable />
              </ProtectedRoute>
            }
          />


          {/* ✅ SUGGESTIONS - All Roles */}
          <Route
            path="/suggestions"
            element={
              <ProtectedRoute>
                <Suggestions />
              </ProtectedRoute>
            }
          />

          {/* ✅ CONTACT - All Roles */}
          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <Contact />
              </ProtectedRoute>
            }
          />

          {/* ✅ SETTINGS - All Roles */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* 🔹 404 - Redirect to Home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <SuggestionProvider>
        <ThemeManager>
          <AppContent />
        </ThemeManager>
      </SuggestionProvider>
    </SettingsProvider>
  );
}

export default App;