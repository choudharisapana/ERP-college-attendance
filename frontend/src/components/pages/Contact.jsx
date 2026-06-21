import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSettings } from "../../context/SettingsContext";

const Contact = () => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    urgencyLevel: "medium",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [error, setError] = useState(null);

  // Force apply theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const root = document.documentElement;
    const body = document.body;
    
    if (savedTheme === "light") {
      root.classList.remove("dark");
      root.style.backgroundColor = "#f9fafb";
      body.style.backgroundColor = "#f9fafb";
      body.style.color = "#111827";
    } else if (savedTheme === "dark") {
      root.classList.add("dark");
      root.style.backgroundColor = "#111827";
      body.style.backgroundColor = "#111827";
      body.style.color = "#f3f4f6";
    } else if (savedTheme === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        root.classList.add("dark");
        root.style.backgroundColor = "#111827";
        body.style.backgroundColor = "#111827";
      } else {
        root.classList.remove("dark");
        root.style.backgroundColor = "#f9fafb";
        body.style.backgroundColor = "#f9fafb";
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:5000/api/support/tickets", formData);
      
      setTicketNumber(response.data.ticket.number);
      setShowSuccess(true);
      
      setFormData({
        name: "",
        email: "",
        subject: "",
        urgencyLevel: "medium",
        message: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowSuccess(false);
    setTicketNumber("");
  };

  return (
    <div className="min-h-screen py-17 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Success Modal */}
        {showSuccess && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-[slideUp_0.3s_ease] border border-gray-100 dark:border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-white shadow-lg shadow-green-500/30 dark:shadow-green-600/30">
                <i className="fas fa-check text-white text-3xl"></i>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Request Sent!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-6">
                Thank you for contacting us. We'll get back to you soon.
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-5 rounded-2xl mb-6 border border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Your Request ID
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-wider">{ticketNumber}</div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                We typically respond within 24 hours.
              </p>
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg shadow-blue-600/30 dark:shadow-blue-700/30"
                onClick={closeModal}
              >
                <i className="fas fa-check-circle mr-2"></i>
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Contact <span className="text-blue-600 dark:text-blue-400">Support</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Have questions or need assistance? We're here to help!
          </p>
        </div>

        {/* Contact Cards - Redesigned - No Blank Space */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Email Card - Clickable Email Link */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-envelope text-blue-600 dark:text-blue-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Email Us
              </h3>
              <a 
                href="mailto:support@eduscheduler.com?subject=Support Request&body=Hello, I need help with..."
                className="text-blue-600 dark:text-blue-400 font-medium mb-2 hover:underline inline-block"
              >
                support@eduschedular.com
              </a>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 mt-2">
                <i className="fas fa-clock text-gray-400 text-xs"></i>
                Response within 24h
              </p>
            </div>
          </div>

          {/* Phone Card - Clickable Phone Link */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/40 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-headset text-green-600 dark:text-green-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Call Us
              </h3>
              <a 
                href="tel:+919284154457"
                className="text-green-600 dark:text-green-400 font-medium mb-2 hover:underline inline-block"
              >
                +91 92841 54457
              </a>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 mt-2">
                <i className="fas fa-clock text-gray-400 text-xs"></i>
                Emergency support available
              </p>
            </div>
          </div>

          {/* Hours Card - Updated to 10AM - 5PM */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-clock text-purple-600 dark:text-purple-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Office Hours
              </h3>
              <p className="text-purple-600 dark:text-purple-400 font-medium mb-2">
                Mon - Fri, 10AM - 5PM
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                <i className="fas fa-calendar-week text-gray-400 text-xs"></i>
                Weekend support available
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">
              Send Us a Message
            </h2>
            <p className="text-blue-100 text-lg mb-4">
              <i className="fas fa-edit mr-2"></i>
              Fill out the form and we'll get back to you within 24 hours
            </p>
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <i className="fas fa-bolt text-yellow-300 mr-2 animate-pulse"></i>
              Average response time: 2-4 hours
            </div>
          </div>

          {/* Form Body */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400"></i>
                <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <i className="fas fa-user mr-2"></i>
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base transition-all duration-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 disabled:opacity-60"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <i className="fas fa-envelope mr-2"></i>
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base transition-all duration-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 disabled:opacity-60"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <i className="fas fa-tag mr-2"></i>
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base transition-all duration-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 disabled:opacity-60"
                    placeholder="What is this regarding?"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <i className="fas fa-flag mr-2"></i>
                    Priority Level
                  </label>
                  <select
                    name="urgencyLevel"
                    value={formData.urgencyLevel}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base transition-all duration-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 disabled:opacity-60 cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <i className="fas fa-comment-dots mr-2"></i>
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base transition-all duration-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 disabled:opacity-60 resize-none min-h-[140px]"
                  placeholder="Please describe your issue or question in detail..."
                />
              </div>

              <button 
                type="submit" 
                className={`w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg shadow-blue-600/30 dark:shadow-blue-800/30 ${
                  loading 
                    ? "opacity-60 cursor-not-allowed" 
                    : "hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-spinner fa-spin text-white"></i>
                    Sending...
                  </span>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <style>
          {`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default Contact;