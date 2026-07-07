import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
    timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});
let isRedirecting = false;
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");

    const isValidToken =
      typeof token === "string" &&
      token.trim() !== "" &&
      token !== "null" &&
      token !== "undefined";

    if (isValidToken) {
      config.headers.Authorization = `Bearer ${token}`;

      if (import.meta.env.DEV) {
        console.log(`Token added to ${config.url}`);
      }
    } else {
      delete config.headers.Authorization;

      if (token === "null" || token === "undefined") {
        localStorage.removeItem("auth_token");
      }

      if (import.meta.env.DEV) {
        console.log(`No valid token for ${config.url}`);
      }
    }

    if (import.meta.env.DEV) {
      console.log(`${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error("Request Error:", error);
    }

    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`${response.status} ${response.config.url}`);
    }

    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error("Response Error:", {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });
    }

    if (
      error.response?.status === 401 &&
      !isRedirecting
    ) {
      const token = localStorage.getItem("auth_token");

      if (
        token &&
        token !== "null" &&
        token !== "undefined"
      ) {
        isRedirecting = true;

        localStorage.removeItem("auth_token");

        window.location.replace("/login");
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
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.post("/auth/reset-password", { token, password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post("/auth/resend-verification", { email }),
  changePassword: (data) => api.put("/auth/change-password", data),
};


export const subjectAPI = {
  getAll: () => api.get("/subjects"),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post("/subjects", data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  getMySubjects: () => api.get("/subjects/my-subjects"), 
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
  getStats: () => api.get("/batches/stats"),
};


export const timetableAPI = {
  getAll: () => api.get("/timetables"),
  getById: (id) => api.get(`/timetables/${id}`),
  create: (data) => api.post("/timetables", data),
  update: (id, data) => api.put(`/timetables/${id}`, data),
  delete: (id) => api.delete(`/timetables/${id}`),
  checkConflicts: (data) => api.post("/timetables/check-conflicts", data),
  publish: (id) => api.put(`/timetables/${id}/publish`),
};



export const leaveAPI = {
  getAll: () => api.get("/leaves"),
  getById: (id) => api.get(`/leaves/${id}`),
  create: (data) => api.post("/leaves", data),
  update: (id, data) => api.put(`/leaves/${id}`, data),
  delete: (id) => api.delete(`/leaves/${id}`),
  getByFacultyId: (facultyId) => api.get(`/leaves/faculty/${facultyId}`),
  getByStatus: (status) => api.get(`/leaves/status/${status}`),
  approve: (id) => api.put(`/leaves/${id}/approve`),
  reject: (id) => api.put(`/leaves/${id}/reject`),
  assignReplacement: (leaveId, data) =>
    api.put(`/leaves/${leaveId}/assign-replacement`, data),
};


export const assignmentAPI = {
  create: (data) => api.post('/assignments', data),
  getAll: () => api.get('/assignments'),
  getById: (id) => api.get(`/assignments/${id}`),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  getByLeaveId: (leaveId) => api.get(`/assignments/leave/${leaveId}`),
  getByFacultyId: (facultyId) => api.get(`/assignments/faculty/${facultyId}`),
};

export const dashboardAPI = {
  getDashboard: () => api.get("/dashboard"),
  getStats: () => api.get("/dashboard/stats"),
  refreshDashboard: () => api.post("/dashboard/refresh"),
};

export const noteAPI = {
  getAll: () => api.get("/notes"),
  add: (data) => api.post("/notes", data),
  delete: (id) => api.delete(`/notes/${id}`),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  patchSettings: (data) => api.patch('/settings', data),
  resetSettings: () => api.post('/settings/reset'),
};


export const notificationAPI = {
  getAll: () => api.get("/notifications"),
  getUnread: () => api.get("/notifications/unread"),
  getById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete("/notifications"),
  getStats: () => api.get("/notifications/stats"),
};


export const suggestionAPI = {
  getAll: (params) => api.get("/suggestions", { params }),
  create: (data) => api.post("/suggestions", data),
  getById: (id) => api.get(`/suggestions/${id}`),
  update: (id, data) => api.put(`/suggestions/${id}`, data),
  delete: (id) => api.delete(`/suggestions/${id}`),
  upvote: (id) => api.post(`/suggestions/${id}/upvote`),
  getStats: () => api.get("/suggestions/stats"),
};

export const supportAPI = {
  createTicket: (data) => api.post("/support/tickets", data),
  getTicket: (number) => api.get(`/support/tickets/${number}`),
};


export const apiServices = {
  auth: authAPI,
  subject: subjectAPI,
  faculty: facultyAPI,
  classroom: classroomAPI,
  batch: batchAPI,
  timetable: timetableAPI,
  leave: leaveAPI,
  dashboard: dashboardAPI,
  settings: settingsAPI,
  notification: notificationAPI,
  suggestion: suggestionAPI,
  support: supportAPI,
  note: noteAPI,
};

export default api;