import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");

      const isValidToken =
        token &&
        token !== "null" &&
        token !== "undefined" &&
        token.trim() !== "" &&
        token.length > 10;

      if (isValidToken) {
        try {
          const response = await api.get("/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data.success) {
            setUser(response.data.user);
          } else {
            localStorage.removeItem("auth_token");
          }
        } catch (error) {
          console.error(" Token verification failed:", error);
          localStorage.removeItem("auth_token");
        }
      } else {
        if (token === "null" || token === "undefined") {
          localStorage.removeItem("auth_token");
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);

      if (response.data.success) {
        if (response.data.requiresVerification) {
          setVerificationRequired(true);
          setPendingEmail(response.data.email);
          return {
            success: true,
            requiresVerification: true,
            email: response.data.email,
            message: response.data.message,
          };
        } else {
          setUser(response.data.user);
          return {
            success: true,
            user: response.data.user,
          };
        }
      }

      return {
        success: false,
        message: response.data.message || "Registration failed",
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.data.success) {
        if (
          response.data.token &&
          response.data.token !== "null" &&
          response.data.token.length > 10
        ) {
          localStorage.setItem("auth_token", response.data.token);
          setUser(response.data.user);
          setVerificationRequired(false);
          setPendingEmail("");
          return {
            success: true,
            user: response.data.user,
          };
        } else {
          return {
            success: false,
            message: "Invalid token received",
          };
        }
      }
      if (response.data.requiresVerification) {
        setVerificationRequired(true);
        setPendingEmail(response.data.email);
        return {
          success: false,
          requiresVerification: true,
          email: response.data.email,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data.message || "Login failed",
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    setVerificationRequired(false);
    setPendingEmail("");
  };

  const verifyEmail = async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Verification failed",
      };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await api.post("/auth/resend-verification", { email });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to resend verification",
      };
    }
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
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};