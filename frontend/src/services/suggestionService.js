import axios from "axios";

const API_URL = "http://localhost:5000/api/suggestions";

// Submit a new suggestion
const submitSuggestion = async (suggestionData) => {
  try {
    const token = localStorage.getItem("token");
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    const response = await axios.post(API_URL, suggestionData, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all suggestions with filters
const getSuggestions = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get single suggestion
const getSuggestion = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Upvote a suggestion
const upvoteSuggestion = async (id) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/${id}/upvote`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get suggestion statistics
const getSuggestionStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats/overview`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const suggestionService = {
  submitSuggestion,
  getSuggestions,
  getSuggestion,
  upvoteSuggestion,
  getSuggestionStats,
};