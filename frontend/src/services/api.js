// frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor - FIXED
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    
    // ✅ Check if token is valid (not null, undefined, empty, or "null" string)
    const isValidToken = token && 
                         token !== "null" && 
                         token !== "undefined" && 
                         token.trim() !== "" && 
                         token.length > 10;
    
    if (isValidToken) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`✅ Token added to ${config.url}`);
    } else {
      // ✅ Remove any invalid Authorization header
      delete config.headers.Authorization;
      // ✅ Clear invalid token from localStorage
      if (token === "null" || token === "undefined") {
        localStorage.removeItem("auth_token");
      }
      console.log(`⚠️ No valid token for ${config.url}`);
    }
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("❌ Response Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });
    
    // ✅ Only redirect on 401 if we have a valid token
    if (error.response?.status === 401) {
      const token = localStorage.getItem("auth_token");
      if (token && token !== "null" && token !== "undefined") {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const subjectAPI = {
  getAll: () => api.get("/subjects"),
  create: (data) => api.post("/subjects", data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

export const facultyAPI = {
  getAll: () => api.get("/faculty"),
  getById: (id) => api.get(`/faculty/${id}`),
  create: (data) => api.post("/faculty", data),
  update: (id, data) => api.put(`/faculty/${id}`, data),
  delete: (id) => api.delete(`/faculty/${id}`),
};

export const classroomAPI = {
  getAll: () => api.get("/classrooms"),
  getById: (id) => api.get(`/classrooms/${id}`),
  create: (data) => api.post("/classrooms", data),
  update: (id, data) => api.put(`/classrooms/${id}`, data),
  delete: (id) => api.delete(`/classrooms/${id}`),
};

export const batchAPI = {
  getAll: () => api.get("/batches"),
  getById: (id) => api.get(`/batches/${id}`),
  create: (data) => api.post("/batches", data),
  update: (id, data) => api.put(`/batches/${id}`, data),
  delete: (id) => api.delete(`/batches/${id}`),
};

export const dashboardAPI = {
  getDashboard: () => api.get("/dashboard"),
  getStats: () => api.get("/dashboard/stats"),
  refreshDashboard: () => api.post("/dashboard/refresh"),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  patchSettings: (data) => api.patch('/settings', data),
  resetSettings: () => api.post('/settings/reset')
};

export const apiServices = {
  auth: authAPI,
  subject: subjectAPI,
  faculty: facultyAPI,
  classroom: classroomAPI,
  batch: batchAPI,
  dashboard: dashboardAPI,
  settings: settingsAPI
};

export default api;