import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class SubjectService {
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

  // Get all subjects
  getAll() {
    return this.api.get('/subjects');
  }

  // Get subject by ID
  getById(id) {
    return this.api.get(`/subjects/${id}`);
  }

  // Create new subject
  create(subjectData) {
    return this.api.post('/subjects', subjectData);
  }

  // Update subject
  update(id, subjectData) {
    return this.api.put(`/subjects/${id}`, subjectData);
  }

  // Delete subject
  delete(id) {
    return this.api.delete(`/subjects/${id}`);
  }

  // Get subjects by department
  getByDepartment(department) {
    return this.api.get(`/subjects/department/${department}`);
  }

  // Get subjects by batch and semester
  getByBatchAndSemester(batchId, semester) {
    return this.api.get(`/subjects/batch/${batchId}/semester/${semester}`);
  }

  // Assign subject to batch semester
  assignToBatchSemester(batchId, semester, subjectId, data) {
    return this.api.post(`/subjects/assign/${subjectId}/batch/${batchId}/semester/${semester}`, data);
  }

  // Remove subject from batch semester
  removeFromBatchSemester(batchId, semester, subjectId) {
    return this.api.delete(`/subjects/assign/${subjectId}/batch/${batchId}/semester/${semester}`);
  }
}

export default new SubjectService();