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
    return this.api.get('/subjects');
  }

  getById(id) {
    return this.api.get(`/subjects/${id}`);
  }

  create(subjectData) {
    return this.api.post('/subjects', subjectData);
  }


  update(id, subjectData) {
    return this.api.put(`/subjects/${id}`, subjectData);
  }

  delete(id) {
    return this.api.delete(`/subjects/${id}`);
  }

  getByDepartment(department) {
    return this.api.get(`/subjects/department/${department}`);
  }

  getByBatchAndSemester(batchId, semester) {
    return this.api.get(`/subjects/batch/${batchId}/semester/${semester}`);
  }

  assignToBatchSemester(batchId, semester, subjectId, data) {
    return this.api.post(`/subjects/assign/${subjectId}/batch/${batchId}/semester/${semester}`, data);
  }

  removeFromBatchSemester(batchId, semester, subjectId) {
    return this.api.delete(`/subjects/assign/${subjectId}/batch/${batchId}/semester/${semester}`);
  }
}

export default new SubjectService();