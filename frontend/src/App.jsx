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

import ProtectedRoute from "./components/pages/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import { SuggestionProvider } from "./context/SuggestionContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";

// Theme Manager Component - to apply theme globally
const ThemeManager = ({ children }) => {
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (!loading && settings) {
      const root = document.documentElement;
      const body = document.body;
      
      // Apply theme from settings
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
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ✅ USER + ADMIN */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/suggestions"
            element={
              <ProtectedRoute>
                <Suggestions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <Contact />
              </ProtectedRoute>
            }
          />

          {/* 🔴 ADMIN ONLY */}
          <Route
            path="/create-timetable"
            element={
              <ProtectedRoute role="admin">
                <CreateTimetable />
              </ProtectedRoute>
            }
          />

          <Route
            path="/subject"
            element={
              <ProtectedRoute role="admin">
                <Subject />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty"
            element={
              <ProtectedRoute role="admin">
                <Faculty />
              </ProtectedRoute>
            }
          />

          <Route
            path="/classrooms"
            element={
              <ProtectedRoute role="admin">
                <Classroom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/studentBatches"
            element={
              <ProtectedRoute>
                <StudentBatches />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

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