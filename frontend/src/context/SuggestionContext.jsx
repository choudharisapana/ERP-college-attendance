import React, { createContext, useState, useContext, useEffect } from "react";
import { suggestionService } from "../services/suggestionService";
import { useAuth } from "./AuthContext";

const SuggestionContext = createContext(null);

export const useSuggestions = () => {
  const context = useContext(SuggestionContext);
  if (!context) {
    throw new Error("useSuggestions must be used within a SuggestionProvider");
  }
  return context;
};

export const SuggestionProvider = ({ children }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 1000,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    category: "All",
    status: "All",
    priority: "All",
    sort: "latest",
    page: 1,
    limit: 10,
  });

  const { user } = useAuth();

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await suggestionService.getSuggestions(filters);
      setSuggestions(data.suggestions || []);
      setStats(data.stats || {});
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message || "Failed to fetch suggestions");
      console.error("Error fetching suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await suggestionService.getSuggestionStats();
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const submitSuggestion = async (suggestionData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await suggestionService.submitSuggestion(suggestionData);

      await fetchSuggestions();
      await fetchStats();
      
      return { success: true, data: response };
    } catch (err) {
      setError(err.message || "Failed to submit suggestion");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const upvoteSuggestion = async (id) => {
    if (!user) {
      return { success: false, message: "Please login to upvote" };
    }

    try {
      const response = await suggestionService.upvoteSuggestion(id);

      setSuggestions(prev =>
        prev.map(suggestion =>
          suggestion._id === id
            ? { ...suggestion, upvotes: response.upvotes }
            : suggestion
        )
      );
      
      return { success: true, data: response };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.category !== prev.category ? 1 : prev.page, // Reset page on category change
    }));
  };

  const changePage = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  useEffect(() => {
    fetchSuggestions();
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const value = {
    suggestions,
    stats,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    changePage,
    submitSuggestion,
    upvoteSuggestion,
    refreshSuggestions: fetchSuggestions,
    refreshStats: fetchStats,
  };

  return (
    <SuggestionContext.Provider value={value}>
      {children}
    </SuggestionContext.Provider>
  );
};