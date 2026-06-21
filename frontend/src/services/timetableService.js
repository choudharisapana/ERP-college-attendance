import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const timetableService = {
  // Get all timetables
  getAll: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/timetables`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get timetable by ID
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/timetables/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create timetable
  create: async (timetableData) => {
    try {
      const response = await axios.post(`${API_URL}/timetables`, timetableData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update timetable
  update: async (id, timetableData) => {
    try {
      const response = await axios.put(`${API_URL}/timetables/${id}`, timetableData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete timetable
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/timetables/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Generate timetable automatically
  generate: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/timetables/generate`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check conflicts
  checkConflicts: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/timetables/check-conflicts`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Publish timetable
  publish: async (id) => {
    try {
      const response = await axios.put(`${API_URL}/timetables/${id}/publish`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default timetableService;