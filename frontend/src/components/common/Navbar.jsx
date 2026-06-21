import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const filteredNotifications = notifications.filter(
    (n) => n.type === "Schedule Change",
  );

  const centerLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "fa-chart-line" },
    {
      name: "Create-Timetable",
      path: "/create-timetable",
      icon: "fa-calendar-plus",
    },
    { name: "Subject", path: "/subject", icon: "fa-solid fa-book-open-reader" },
    {
      name: "Classrooms",
      path: "/classrooms",
      icon: "fa-solid fa-chalkboard-user",
    },
    { name: "Faculty", path: "/faculty", icon: "fa-solid fa-users" },
    {
      name: "StudentBatches",
      path: "/studentBatches",
      icon: "fa-solid fa-clipboard-list",
    },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Function to get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle logo click - always go to landing page
  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate("/");
  };

  // Handle profile click to navigate to profile page
  const handleProfileClick = () => {
    navigate("/profile");
  };

  // Helper function to check if notification is unread for current user
  const isNotificationUnread = (notification) => {
    return notification.recipients?.some(r => r.user === user?._id && !r.read);
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);

        // Calculate unread count using the helper function
        const unreadNotifications = (data.notifications || []).filter(
          (n) => n.type === "Schedule Change" && isNotificationUnread(n)
        );
        setUnreadCount(unreadNotifications.length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification._id === notificationId
              ? {
                  ...notification,
                  recipients: notification.recipients.map((r) =>
                    r.user === user._id ? { ...r, read: true } : r,
                  ),
                }
              : notification,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read - FIXED ✅
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/notifications/mark-all-read",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            recipients: notification.recipients.map((r) =>
              r.user === user._id ? { ...r, read: true } : r,
            ),
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (notification.recipients?.some(r => r.user === user?._id && !r.read)) {
      markAsRead(notification._id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setShowNotifications(false);
    }
  };

  // Handle view all notifications
  const handleViewAll = () => {
    navigate("/notifications");
    setShowNotifications(false);
  };

  // Format time for notification
  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return notificationDate.toLocaleDateString();
  };

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <nav className="bg-blue-600 shadow-lg fixed top-0 left-0 w-full z-50">
      <div className="flex items-center justify-between h-16 px-0">
        {/* Left side (EduScheduler Logo - Clickable) */}
        <button
          onClick={handleLogoClick}
          className="flex items-center space-x-2 pl-4 hover:opacity-80 transition-opacity"
        >
          <i className="fas fa-calendar-check text-white text-2xl"></i>
          <span className="text-white font-bold text-2xl">EduScheduler</span>
        </button>

        {/* Center Links (Desktop) - Only show when user is logged in */}
        {user && (
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-baseline space-x-2">
              {centerLinks
                .filter((link) => {
                  if (user.role === "admin") return true;

                  return [
                    "/dashboard",
                    "/studentBatches",
                    "/settings",
                    "/suggestions",
                    "/contact",
                  ].includes(link.path);
                })
                .map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                        isActive
                          ? "bg-white text-blue-600 shadow-md"
                          : "text-blue-100 hover:bg-blue-500 hover:text-white"
                      }`
                    }
                  >
                    <i className={`fas ${link.icon} w-4`}></i>
                    <span>{link.name}</span>
                  </NavLink>
                ))}
            </div>
          </div>
        )}

        {/* Right side - Notification Icon and User Profile Button */}
        <div className="hidden md:flex items-center space-x-2 pr-4">
          {user ? (
            <>
              {/* Notification Icon with Dropdown */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 rounded-lg text-blue-100 hover:bg-blue-500 hover:text-white transition-all duration-200"
                >
                  <i className="fas fa-bell text-xl"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-600">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-100 hover:text-blue-600"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className={`p-3 border-b border-gray-600 hover:bg-gray-50 cursor-pointer transition-colors ${
                              isNotificationUnread(notification)
                                ? "bg-blue-50"
                                : ""
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 ${
                                    isNotificationUnread(notification)
                                      ? "bg-blue-500"
                                      : "bg-gray-300"
                                  }`}
                                ></div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-600">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {formatTime(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-600">
                          <i className="fas fa-bell-slash text-2xl mb-2"></i>
                          <p>No notifications</p>
                        </div>
                      )}
                    </div>
                    {filteredNotifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200">
                        <button
                          onClick={handleViewAll}
                          className="text-sm text-blue-600 hover:text-blue-600 w-full text-center"
                        >
                          View All Notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User profile button - clickable to navigate to profile */}
              <button
                onClick={handleProfileClick}
                className="flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-blue-500 hover:text-white text-blue-100"
              >
                {/* User Avatar with Initials */}
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {getUserInitials(user.name)}
                </div>

                {/* User info with name and role */}
                <div className="flex flex-col text-left">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-xs text-blue-200">
                    {user.role
                      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      : "User"}
                  </span>
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Login button */}
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-blue-100 hover:bg-blue-500 hover:text-white"
                  }`
                }
              >
                <i className="fa-solid fa-right-to-bracket w-4"></i>
                <span>Login</span>
              </NavLink>

              {/* Register button */}
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-blue-100 hover:bg-blue-500 hover:text-white"
                  }`
                }
              >
                <i className="fa-solid fa-user-plus w-4"></i>
                <span>Register</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden pr-4">
          <button
            onClick={toggleMenu}
            className="inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <span className="sr-only">Open main menu</span>
            <i
              className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"} text-lg`}
            ></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-2 pt-2 pb-4 space-y-1 bg-blue-600 shadow-inner">
          {/* Show navigation links only when user is logged in */}
          {user && (
            <>
              {/* User info in mobile menu with notification */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500 mb-2">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleProfileClick();
                  }}
                  className="flex items-center space-x-3 hover:bg-blue-500 rounded-lg transition-colors flex-1"
                >
                  <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                    {getUserInitials(user.name)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-semibold">
                      {user.name}
                    </span>
                    <span className="text-blue-200 text-sm">
                      {user.role
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : "User"}
                    </span>
                  </div>
                </button>

                {/* Notification icon for mobile */}
                <button
                  onClick={() => {
                    toggleNotifications();
                  }}
                  className="relative p-2 rounded-lg text-blue-100 hover:bg-blue-500"
                >
                  <i className="fas fa-bell text-xl"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile notifications dropdown */}
              {showNotifications && (
                <div className="mx-2 mb-2 bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredNotifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => {
                          handleNotificationClick(notification);
                          setIsMenuOpen(false);
                        }}
                        className={`p-3 border-b border-gray-100 cursor-pointer ${
                          isNotificationUnread(notification)
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    ))}
                    {filteredNotifications.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    )}
                  </div>
                  {filteredNotifications.length > 0 && (
                    <button
                      onClick={handleViewAll}
                      className="w-full p-2 text-center text-xs text-blue-600 border-t border-gray-200"
                    >
                      View all
                    </button>
                  )}
                </div>
              )}

              {centerLinks
                .filter((link) => {
                  if (user.role === "admin") return true;

                  return [
                    "/dashboard",
                    "/studentBatches",
                    "/settings",
                    "/suggestions",
                    "/contact",
                  ].includes(link.path);
                })
                .map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-lg text-base font-semibold transition-colors flex items-center space-x-3 ${
                        isActive
                          ? "bg-white text-blue-600 shadow-md"
                          : "text-blue-100 hover:bg-blue-500 hover:text-white"
                      }`
                    }
                  >
                    <i className={`fas ${link.icon} w-5 text-center`}></i>
                    <span>{link.name}</span>
                  </NavLink>
                ))}
            </>
          )}

          {/* Show login/register when user is not logged in */}
          {!user && (
            <>
              <NavLink
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg text-base font-semibold transition-colors flex items-center space-x-3 ${
                    isActive
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-blue-100 hover:bg-blue-500 hover:text-white"
                  }`
                }
              >
                <i className="fa-solid fa-right-to-bracket w-5 text-center"></i>
                <span>Login</span>
              </NavLink>

              <NavLink
                to="/register"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg text-base font-semibold transition-colors flex items-center space-x-3 ${
                    isActive
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-blue-100 hover:bg-blue-500 hover:text-white"
                  }`
                }
              >
                <i className="fa-solid fa-user-plus w-5 text-center"></i>
                <span>Register</span>
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;