import React, { useState, useEffect } from "react";
import { useSuggestions } from "../../context/SuggestionContext";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "date-fns";

const SuggestionsList = () => {
  const {
    suggestions,
    stats,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    changePage,
    upvoteSuggestion,
  } = useSuggestions();
  const { user } = useAuth();
  const [upvoting, setUpvoting] = useState({});

  const categories = [
    "All",
    "Feature Request",
    "Bug Report",
    "Improvement",
    "UI/UX Feedback",
    "Performance",
    "General Feedback",
  ];

  const statuses = ["All", "Pending", "Under Review", "Approved", "Implemented", "Rejected"];
  const priorities = ["All", "Low", "Medium", "High", "Critical"];
  const sortOptions = [
    { value: "latest", label: "Latest" },
    { value: "oldest", label: "Oldest" },
    { value: "most-upvoted", label: "Most Upvoted" },
  ];

  const getCategoryIcon = (category) => {
  const labels = {
    "Feature Request": "Feature Request",
    "Bug Report": "Bug Report",
    Improvement: "Improvement",
    "UI/UX Feedback": "UI/UX Feedback",
    Performance: "Performance",
    "General Feedback": "General Feedback",
  };

  return labels[category] || "Other";
};

  const getPriorityColor = (priority) => {
    const colors = {
      Low: "text-green-600 bg-green-100",
      Medium: "text-yellow-600 bg-yellow-100",
      High: "text-orange-600 bg-orange-100",
      Critical: "text-red-600 bg-red-100",
    };
    return colors[priority] || "text-gray-600 bg-gray-100";
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "text-yellow-600 bg-yellow-100",
      "Under Review": "text-blue-600 bg-blue-100",
      Approved: "text-green-600 bg-green-100",
      Implemented: "text-purple-600 bg-purple-100",
      Rejected: "text-red-600 bg-red-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  const handleUpvote = async (id) => {
    if (!user) {
      alert("Please login to upvote suggestions");
      return;
    }

    setUpvoting((prev) => ({ ...prev, [id]: true }));
    await upvoteSuggestion(id);
    setUpvoting((prev) => ({ ...prev, [id]: false }));
  };

  if (loading && suggestions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Community Suggestions
        </h1>
        <p className="text-lg text-gray-600">
          Help us improve EduScheduler by voting on suggestions
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.implemented}</div>
            <div className="text-sm text-gray-600">Implemented</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.featureRequests}</div>
            <div className="text-sm text-gray-600">Features</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => updateFilters({ priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion._id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              {/* Upvote Button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleUpvote(suggestion._id)}
                  disabled={upvoting[suggestion._id] || !user}
                  className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-colors ${
                    user
                      ? "hover:bg-blue-50"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${
                      suggestion.upvotedBy?.includes(user?._id)
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 10.5L10 2l8 8.5-2 2-6-6-6 6-2-2z" />
                  </svg>
                  <span className="text-sm font-semibold">
                    {suggestion.upvotes || 0}
                  </span>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{getCategoryIcon(suggestion.category)}</span>
                  <span className="text-sm font-medium text-gray-500">
                    {suggestion.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                    {suggestion.status}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {suggestion.suggestion.substring(0, 100)}...
                </h3>

                <p className="text-gray-600 mb-4">
                  {suggestion.suggestion.substring(0, 200)}...
                  {suggestion.suggestion.length > 200 && (
                    <button className="text-blue-600 hover:underline ml-1">
                      Read more
                    </button>
                  )}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      By {suggestion.isAnonymous ? "Anonymous" : suggestion.name}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(suggestion.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {suggestion.adminResponse && (
                    <span className="text-green-600">✓ Admin responded</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {suggestions.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💭</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No suggestions found
            </h3>
            <p className="text-gray-500">
              Be the first to share your idea!
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => changePage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => changePage(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SuggestionsList;