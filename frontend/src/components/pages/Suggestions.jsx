import React, { useState, useEffect } from "react";
import axios from "axios";

const Suggestions = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    occupation: "Student",
    category: "Feature Request",
    suggestion: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSuggestions, setTotalSuggestions] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allSuggestions, setAllSuggestions] = useState([]); 

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";  
  const SUGGESTIONS_PER_PAGE = 20; 

  useEffect(() => {
    const fetchAllSuggestions = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `${API_URL}/suggestions?sort=latest&limit=1000`, 
        );

        if (response.data.success) {
          setAllSuggestions(response.data.suggestions || []);
          setSuggestions(response.data.suggestions || []);
          setTotalSuggestions(response.data.stats?.total || 0);

          const total = response.data.suggestions.length;
          setTotalPages(Math.ceil(total / SUGGESTIONS_PER_PAGE));
          setHasMore(total > SUGGESTIONS_PER_PAGE);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSuggestions([]);
        setAllSuggestions([]);
        setTotalSuggestions(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSuggestions();
  }, []);

  useEffect(() => {
    if (selectedCategory === "All") {
      setSuggestions(allSuggestions);
    } else {
      const filtered = allSuggestions.filter(
        (s) => s.category === selectedCategory,
      );
      setSuggestions(filtered);
    }
    setCurrentPage(1); 
  }, [selectedCategory, allSuggestions]);

  const getCurrentPageSuggestions = () => {
    const startIndex = (currentPage - 1) * SUGGESTIONS_PER_PAGE;
    const endIndex = startIndex + SUGGESTIONS_PER_PAGE;
    return suggestions.slice(startIndex, endIndex);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.suggestion) {
      alert("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
     const response = await axios.post(`${API_URL}/suggestions`, formData);

      if (response.data.success) {
        setSubmitted(true);

        const refreshResponse = await axios.get(
          `${API_URL}/suggestions?sort=latest&limit=1000`,
        );
        if (refreshResponse.data.success) {
          setAllSuggestions(refreshResponse.data.suggestions || []);
          setSuggestions(refreshResponse.data.suggestions || []);
          setTotalSuggestions(refreshResponse.data.stats?.total || 0);

          const total = refreshResponse.data.suggestions?.length || 0;
          setTotalPages(Math.ceil(total / SUGGESTIONS_PER_PAGE));
        }
      }
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      alert(
        error.response?.data?.message ||
          "Failed to submit suggestion. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }

    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        occupation: "Student",
        category: "Feature Request",
        suggestion: "",
      });
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      occupation: "Student",
      category: "Feature Request",
      suggestion: "",
    });
    setSubmitted(false);
  };

  const categories = [
    { value: "Feature Request", label: "Feature Request" },
    { value: "Bug Report", label: "Bug Report" },
    { value: "Improvement", label: "Improvement" },
    { value: "UI/UX Feedback", label: "UI/UX Feedback" },
    { value: "Performance", label: "Performance" },
    { value: "General Feedback", label: "General Feedback" },
    { value: "Other", label: "Other" },
  ];

  const occupations = [
    { value: "Student", label: "Student" },
    { value: "Teacher", label: "Teacher" },
    { value: "Admin", label: "Admin" },
    { value: "Other", label: "Other" },
  ];

  const filterCategories = [
    "All",
    ...new Set(allSuggestions.map((s) => s.category)),
  ];

  const currentSuggestions = getCurrentPageSuggestions();

  if (submitted) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-gray-600 mb-3">
            Suggestion Submitted!
          </h3>

          <p className="text-gray-600 max-w-md mx-auto mb-8">
            Thank you for your feedback. Our team will review your suggestion.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Another
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50/2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 py-14">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">
          Suggestions & Feedback
        </h1>
        <p className="text-gray-600 text-lg">
          Help us improve with your ideas and suggestions
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <div className="bg-gray-50 px-4 py-2 rounded-full">
          <span className="text-sm font-medium text-gray-600">
            Total suggestions:
          </span>
          <span className="ml-2 text-lg font-semibold text-blue-600">
            {totalSuggestions}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-blue-50 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <i className="fas fa-lightbulb text-yellow-500 text-2xl"></i>
              <div>
                <h3 className="font-medium text-gray-800 mb-1">
                  Share Your Ideas
                </h3>
                <p className="text-sm text-gray-600">
                  Your feedback helps shape the future of our product.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Occupation
                  </label>
                  <select
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {occupations.map((occ) => (
                      <option key={occ.value} value={occ.value}>
                        {occ.icon} {occ.label}

                      </option>
                    ))}
                  
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Your Suggestion <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="5"
                  name="suggestion"
                  value={formData.suggestion}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe your suggestion in detail..."
                ></textarea>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-400">
                    {formData.suggestion.length}/1000
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                    isSubmitting
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Suggestion"
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium text-gray-900">
              Latest Suggestions
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filterCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
              <p className="mt-3 text-gray-600">Loading suggestions...</p>
            </div>
          ) : currentSuggestions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No suggestions found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {currentSuggestions.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                          item.category === "Feature Request"
                            ? "bg-purple-50 text-purple-600"
                            : item.category === "Bug Report"
                              ? "bg-red-50 text-red-600"
                              : item.category === "Improvement"
                                ? "bg-blue-50 text-blue-600"
                                : item.category === "UI/UX Feedback"
                                  ? "bg-pink-50 text-pink-600"
                                  : item.category === "Performance"
                                    ? "bg-yellow-50 text-yellow-600"
                                    : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {item.category === "Feature Request" ? (
                          <i className="fas fa-lightbulb text-yellow-500"></i>
                        ) : item.category === "Bug Report" ? (
                          <i className="fas fa-bug text-red-500"></i>
                        ) : item.category === "Improvement" ? (
                          <i className="fas fa-rocket text-blue-500"></i>
                        ) : item.category === "UI/UX Feedback" ? (
                          <i className="fas fa-palette text-pink-500"></i>
                        ) : item.category === "Performance" ? (
                          <i className="fas fa-bolt text-yellow-500"></i>
                        ) : (
                          <i className="fas fa-file-alt text-gray-500"></i>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {item.occupation === "Student" ? (
                              <i className="fas fa-user-graduate"></i>
                            ) : item.occupation === "Teacher" ? (
                              <i className="fas fa-chalkboard-teacher"></i>
                            ) : item.occupation === "Admin" ? (
                              <i className="fas fa-user-tie"></i>
                            ) : (
                              <i className="fas fa-user"></i>
                            )}
                            {item.occupation || "Student"}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mt-2">
                          {item.suggestion}
                        </p>

                        <div className="mt-2 text-xs text-gray-400">
                          By: {item.isAnonymous ? "Anonymous" : item.name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          <div className="mt-6 bg-yellow-50 rounded-xl border border-yellow-200 p-5">
            <div className="flex items-center gap-2 mb-3">
             <i className="fas fa-lightbulb text-yellow-500 text-2xl"></i>
              <h4 className="font-medium text-yellow-800">
                Tips for good suggestions
              </h4>
            </div>

            <ul className="space-y-2 text-sm text-yellow-700">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Be specific about the problem</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Include steps if reporting a bug</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Suggest a clear solution</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suggestions;