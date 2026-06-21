import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const dashboardAPI = {
  // Get dashboard data (cached)
  getDashboard: async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  // Get fresh statistics
  getStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Refresh dashboard data
  refreshDashboard: async () => {
    try {
      const response = await axios.post(`${API_URL}/dashboard/refresh`);
      return response.data;
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      throw error;
    }
  }
};

export default dashboardAPI;