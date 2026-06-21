import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class BatchService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // ✅ CORRECTED: Remove duplicate getAll function
  // Get all batches
  getAll() {
    return this.api.get('/batches');
  }

  // Get batch by ID
  getById(id) {
    return this.api.get(`/batches/${id}`);
  }

  // Create new batch
  create(batchData) {
    return this.api.post('/batches', batchData);
  }

  // Update batch
  update(id, batchData) {
    return this.api.put(`/batches/${id}`, batchData);
  }

  // Delete batch
  delete(id) {
    return this.api.delete(`/batches/${id}`);
  }

  // Get subjects for specific semester
  getSemesterSubjects(batchId, semester) {
    return this.getById(batchId);
  }

  // Add subject to specific semester
  addSubjectToSemester(batchId, semesterNumber, subjectData) {
    return this.api.post(`/batches/${batchId}/semesters/${semesterNumber}/subjects`, subjectData);
  }

  // Remove subject from specific semester
  removeSubjectFromSemester(batchId, semesterNumber, subjectId) {
    return this.api.delete(`/batches/${batchId}/semesters/${semesterNumber}/subjects/${subjectId}`);
  }

  // Get batches by department
  getByDepartment(department) {
    return this.api.get(`/batches?department=${department}`);
  }

  // Get batches by status
  getByStatus(status) {
    return this.api.get(`/batches?status=${status}`);
  }
}

export default new BatchService();