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

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
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


  getAll() {
    return this.api.get('/batches');
  }

  getById(id) {
    return this.api.get(`/batches/${id}`);
  }

  create(batchData) {
    return this.api.post('/batches', batchData);
  }

  update(id, batchData) {
    return this.api.put(`/batches/${id}`, batchData);
  }

  delete(id) {
    return this.api.delete(`/batches/${id}`);
  }

  getSemesterSubjects(batchId, semester) {
    return this.getById(batchId);
  }

  addSubjectToSemester(batchId, semesterNumber, subjectData) {
    return this.api.post(`/batches/${batchId}/semesters/${semesterNumber}/subjects`, subjectData);
  }

  removeSubjectFromSemester(batchId, semesterNumber, subjectId) {
    return this.api.delete(`/batches/${batchId}/semesters/${semesterNumber}/subjects/${subjectId}`);
  }

  getByDepartment(department) {
    return this.api.get(`/batches?department=${department}`);
  }

  getByStatus(status) {
    return this.api.get(`/batches?status=${status}`);
  }
}

export default new BatchService();