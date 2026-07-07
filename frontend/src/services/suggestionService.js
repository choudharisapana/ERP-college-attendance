import api from "./api";

const submitSuggestion = async (suggestionData) => {
  try {
    const response = await api.post("/suggestions", suggestionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
const getSuggestions = async (filters = {}) => {
  try {
    const response = await api.get("/suggestions", {
      params: filters,
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const getSuggestion = async (id) => {
  try {
    const response = await api.get(`/suggestions/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const upvoteSuggestion = async (id) => {
  try {
    const response = await api.post(`/suggestions/${id}/upvote`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const getSuggestionStats = async () => {
  try {
    const response = await api.get("/suggestions/stats/overview");
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