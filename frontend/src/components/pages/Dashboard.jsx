import React, { useState, useEffect, useRef } from "react";
import { dashboardAPI, leaveAPI, facultyAPI, noteAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

const Dashboard = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [leaveData, setLeaveData] = useState({
    pendingLeaves: [],
    assignedLeaves: [],
    leavesNeedingReplacement: [],
    totalLeaves: 0,
    pendingCount: 0,
    activeCount: 0,
    assignedCount: 0,
  });
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("week");
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [isLeaveDropdownOpen, setIsLeaveDropdownOpen] = useState(false);
  const [showAssignedLeaves, setShowAssignedLeaves] = useState(false);
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [selectedLeaveForReplacement, setSelectedLeaveForReplacement] = useState(null);
  const [availableFacultyForReplacement, setAvailableFacultyForReplacement] = useState([]);
  const [selectedReplacementFaculty, setSelectedReplacementFaculty] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");

  const [adminNotes, setAdminNotes] = useState([]);
  const [facultyNotes, setFacultyNotes] = useState([]);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [showFacultyInput, setShowFacultyInput] = useState(false);
  const [adminNoteText, setAdminNoteText] = useState("");
  const [facultyNoteText, setFacultyNoteText] = useState("");
  const [adminNoteColor, setAdminNoteColor] = useState("blue");
  const [facultyNoteColor, setFacultyNoteColor] = useState("blue");
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const userRole = user?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isFaculty = userRole === 'faculty';
  const isUser = userRole === 'user';

  const [counts, setCounts] = useState({
    batches: 0,
    faculty: 0,
    students: 0,
    classrooms: 0,
    subjects: 0,
    timetables: 0,
  });

  const chartRef = useRef(null);

  useEffect(() => {
    fetchAllData();
    loadNotes();
  }, []);

  useEffect(() => {
    if (dashboardData?.stats) {
      animateCounts(dashboardData.stats);
    }
  }, [dashboardData]);

  const animateCounts = (stats) => {
    const targets = {
      batches: stats.totalBatches || 0,
      faculty: stats.totalFaculty || 0,
      students: stats.totalStudents || 0,
      classrooms: stats.totalClassrooms || 0,
      subjects: stats.totalSubjects || 0,
      timetables: stats.totalTimetables || 0,
    };

    const duration = 1000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const startValues = {
      batches: 0,
      faculty: 0,
      students: 0,
      classrooms: 0,
      subjects: 0,
      timetables: 0,
    };

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounts({
        batches: Math.round(
          startValues.batches + (targets.batches - startValues.batches) * eased,
        ),
        faculty: Math.round(
          startValues.faculty + (targets.faculty - startValues.faculty) * eased,
        ),
        students: Math.round(
          startValues.students +
          (targets.students - startValues.students) * eased,
        ),
        classrooms: Math.round(
          startValues.classrooms +
          (targets.classrooms - startValues.classrooms) * eased,
        ),
        subjects: Math.round(
          startValues.subjects +
          (targets.subjects - startValues.subjects) * eased,
        ),
        timetables: Math.round(
          startValues.timetables +
          (targets.timetables - startValues.timetables) * eased,
        ),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounts({
          batches: targets.batches,
          faculty: targets.faculty,
          students: targets.students,
          classrooms: targets.classrooms,
          subjects: targets.subjects,
          timetables: targets.timetables,
        });
      }
    }, interval);

    return () => clearInterval(timer);
  };

  const loadNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const response = await noteAPI.getAll();
      if (response.data?.success) {
        const { adminNotes: admin, facultyNotes: faculty } = response.data.data;
        setAdminNotes(admin || []);
        setFacultyNotes(faculty || []);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      try {
        const savedAdmin = localStorage.getItem("adminNotes");
        const savedFaculty = localStorage.getItem("facultyNotes");
        if (savedAdmin) setAdminNotes(JSON.parse(savedAdmin));
        if (savedFaculty) setFacultyNotes(JSON.parse(savedFaculty));
      } catch (e) {
        console.error('Error loading notes from localStorage:', e);
      }
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleSaveNote = async (type) => {
    const text = type === "admin" ? adminNoteText : facultyNoteText;
    if (!text.trim()) return;

    const color = type === "admin" ? adminNoteColor : facultyNoteColor;

    try {
      const response = await noteAPI.add({
        type,
        text: text.trim(),
        color,
      });

      if (response.data?.success) {
        const newNote = response.data.data;
        if (type === "admin") {
          setAdminNotes([newNote, ...adminNotes]);
          setAdminNoteText("");
          setShowAdminInput(false);
        } else {
          setFacultyNotes([newNote, ...facultyNotes]);
          setFacultyNoteText("");
          setShowFacultyInput(false);
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  const handleDeleteNote = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await noteAPI.delete(id);

      if (type === "admin") {
        const updated = adminNotes.filter((n) => n._id !== id);
        setAdminNotes(updated);
      } else {
        const updated = facultyNotes.filter((n) => n._id !== id);
        setFacultyNotes(updated);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchLeaveData(),
        fetchFaculty(),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      if (response.data?.data) {
        setDashboardData(response.data.data);
      } else if (response.data) {
        setDashboardData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      throw err;
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await facultyAPI.getAll();
      let facultyData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          facultyData = response.data.data;
        } else if (Array.isArray(response.data)) {
          facultyData = response.data;
        }
      }
      setFacultyMembers(facultyData);
    } catch (err) {
      console.error("Error fetching faculty:", err);
    }
  };

  const fetchLeaveData = async () => {
    try {
      const response = await leaveAPI.getAll();
      const leaves = response.data?.data || response.data || [];
      const currentDate = new Date();

      const leavesNeedingReplacement = leaves.filter(
        (leave) =>
          leave.status === "Approved" &&
          !leave.replacementAssigned &&
          new Date(leave.toDate) >= currentDate,
      );

      const assignedLeaves = leaves.filter(
        (leave) =>
          leave.status === "Approved" &&
          leave.replacementAssigned === true &&
          leave.replacementFacultyName &&
          new Date(leave.toDate) >= currentDate,
      );

      const enrichedLeaves = await Promise.all(
        leaves.map(async (leave) => {
          try {
            let faculty = null;
            if (leave.facultyId) {
              const facultyResponse = await facultyAPI.getAll();
              const allFaculty =
                facultyResponse.data?.data || facultyResponse.data || [];
              faculty = allFaculty.find(
                (f) =>
                  f.facultyId === leave.facultyId ||
                  f._id === leave.facultyId ||
                  f._id?.toString() === leave.facultyId?.toString(),
              );
            }
            return {
              ...leave,
              facultyName:
                faculty?.name || leave.facultyName || "Unknown Faculty",
              facultyEmail: faculty?.email || "No Email",
              department:
                faculty?.department || leave.department || "Unknown Department",
            };
          } catch (error) {
            return {
              ...leave,
              facultyName: leave.facultyName || "Unknown Faculty",
              facultyEmail: "No Email",
              department: leave.department || "Unknown Department",
            };
          }
        }),
      );

      const enrichedNeedingReplacement = enrichedLeaves.filter(
        (l) =>
          l.status === "Approved" &&
          !l.replacementAssigned &&
          new Date(l.toDate) >= currentDate,
      );

      const enrichedAssignedLeaves = enrichedLeaves.filter(
        (l) =>
          l.status === "Approved" &&
          l.replacementAssigned === true &&
          l.replacementFacultyName &&
          new Date(l.toDate) >= currentDate,
      );

      setLeaveData({
        pendingLeaves: leaves.filter(l => l.status === "Pending"),
        assignedLeaves: enrichedAssignedLeaves,
        totalLeaves: leaves.length,
        pendingCount: leaves.filter(l => l.status === "Pending").length,
        activeCount: leaves.filter(l => l.status === "Approved" && new Date(l.fromDate) <= currentDate && new Date(l.toDate) >= currentDate).length,
        assignedCount: enrichedAssignedLeaves.length,
        leavesNeedingReplacement: enrichedNeedingReplacement,
      });
    } catch (error) {
      console.error("Error fetching leave data:", error);
      setLeaveData({
        pendingLeaves: [],
        assignedLeaves: [],
        leavesNeedingReplacement: [],
        totalLeaves: 0,
        pendingCount: 0,
        activeCount: 0,
        assignedCount: 0,
      });
    }
  };

  const getLeaveStatus = (leave) => {
    const now = new Date();
    const from = new Date(leave.fromDate);
    const to = new Date(leave.toDate);

    if (from <= now && to >= now) return "On Leave Now";
    if (from > now) {
      const daysUntil = Math.ceil((from - now) / (1000 * 60 * 60 * 24));
      return `Starts in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`;
    }
    return "Completed";
  };

  const getDaysRemaining = (toDate) => {
    const end = new Date(toDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getAvailableFaculty = (leave) => {
    return facultyMembers.filter(
      (faculty) =>
        faculty.facultyId !== leave.facultyId &&
        faculty._id !== leave.facultyId
    );
  };

  const openReplacementModal = (leave) => {
    setSelectedLeaveForReplacement(leave);
    const available = getAvailableFaculty(leave);
    setAvailableFacultyForReplacement(available);
    setSelectedReplacementFaculty(null);
    setIsReplacementModalOpen(true);
  };

  const handleAssignReplacement = async () => {
    if (!selectedReplacementFaculty) {
      alert("Please select a replacement faculty member");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await leaveAPI.assignReplacement(selectedLeaveForReplacement._id, {
        replacementFacultyId:
          selectedReplacementFaculty.facultyId ||
          selectedReplacementFaculty._id,
        replacementFacultyName: selectedReplacementFaculty.name,
        replacementFacultyEmail: selectedReplacementFaculty.email,
      });

      if (response.data?.success) {
        alert(
          `Replacement assigned successfully!\n\n${selectedReplacementFaculty.name} will cover for ${selectedLeaveForReplacement.facultyName}`,
        );
        setIsReplacementModalOpen(false);
        setSelectedLeaveForReplacement(null);
        setSelectedReplacementFaculty(null);

        await fetchLeaveData();
      } else {
        throw new Error(response.data?.message || "Failed to assign replacement");
      }
    } catch (err) {
      console.error("Error assigning replacement:", err);
      alert("Failed to assign replacement faculty. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAssignedLeaves = () => {
    const assignedLeaves = leaveData.assignedLeaves || [];

    if (assignedLeaves.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <p>No assigned replacements yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {assignedLeaves.map((leave) => (
          <div
            key={leave._id}
            className="border-l-4 border-green-500 bg-green-50 p-3 rounded-r-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <span className="font-semibold text-gray-800">
                    {leave.facultyName}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    {leave.department}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    Assigned
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(leave.fromDate).toLocaleDateString()} -{" "}
                  {new Date(leave.toDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Replacement: <strong>{leave.replacementFacultyName}</strong>
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400">
                  {getDaysRemaining(leave.toDate)} days left
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLeaveNotifications = () => {
    const leavesNeedingReplacement = leaveData.leavesNeedingReplacement || [];

    if (leavesNeedingReplacement.length === 0) {
      return (
        <div className="text-center py-6">
          <i className="fas fa-check-circle text-4xl text-green-400 mb-2"></i>
          <p className="text-gray-600">
            All faculty members have replacement assigned
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {leavesNeedingReplacement.map((leave) => {
          const leaveStatus = getLeaveStatus(leave);
          const isActive = leaveStatus === "On Leave Now";

          return (
            <div
              key={leave._id}
              className={`border-l-4 ${isActive ? "border-red-500" : "border-yellow-500"} ${isActive ? "bg-red-50" : "bg-yellow-50"} p-3 rounded-r-lg`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="font-semibold text-gray-800">
                      {leave.facultyName}
                    </span>

                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {leave.department}
                    </span>

                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {leave.leaveType}
                    </span>

                    <span
                      className={`${isActive
                          ? "bg-red-100 text-red-800"
                          : "bg-orange-100 text-orange-800"
                        } px-2 py-0.5 rounded-full text-xs font-medium`}
                    >
                      {isActive ? "🔴 Replacement Needed" : "🟡 Upcoming Leave"}
                    </span>

                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {leaveStatus}
                    </span>

                    {getDaysRemaining(leave.toDate) > 0 && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        {getDaysRemaining(leave.toDate)} days left
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openReplacementModal(leave);
                    }}
                    className="mt-2 px-4 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <i className="fas fa-user-plus mr-1"></i>
                    Assign Replacement
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const LeaveAlert = () => (
    <div
      className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 cursor-pointer hover:bg-red-100 transition-colors"
      onClick={() => setIsLeaveDropdownOpen(!isLeaveDropdownOpen)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className="fas fa-bell text-red-500 text-lg"></i>
            {leaveData.leavesNeedingReplacement.length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <span className="font-medium text-red-700">
            Leave updates — {leaveData.leavesNeedingReplacement.length} pending
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {leaveData.leavesNeedingReplacement.length} pending
          </span>
          {leaveData.assignedCount > 0 && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {leaveData.assignedCount} assigned
            </span>
          )}
          <i
            className={`fas fa-chevron-${isLeaveDropdownOpen ? "up" : "down"} text-gray-500 transition-transform`}
          ></i>
        </div>
      </div>

      {isLeaveDropdownOpen && (
        <div className="mt-4 pt-4 border-t border-red-200">
          {renderLeaveNotifications()}

          {leaveData.assignedCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssignedLeaves(!showAssignedLeaves);
                }}
              >
                <h4 className="font-semibold text-green-600">
                  Assigned Replacements ({leaveData.assignedCount})
                </h4>
                <i
                  className={`fas fa-chevron-${showAssignedLeaves ? "up" : "down"} text-gray-400`}
                ></i>
              </div>
              {showAssignedLeaves && (
                <div className="mt-3">{renderAssignedLeaves()}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAllData();
      await loadNotes();
    } catch (err) {
      console.error("Error refreshing dashboard:", err);
      setError("Failed to refresh dashboard");
    } finally {
      setRefreshing(false);
    }
  };

  const getFilteredActivities = () => {
    const activities = dashboardData?.recentActivities || [];

    if (activityFilter === "all") return activities;

    return activities.filter(
      (activity) => activity.type === activityFilter
    );
  };

  const getColorClass = (color) => {
    const map = {
      blue: "border-blue-500",
      yellow: "border-yellow-500",
      green: "border-green-500",
      red: "border-red-500",
    };
    return map[color] || "border-blue-500";
  };

  const getColorBg = (color) => {
    const map = {
      blue: "bg-blue-50",
      yellow: "bg-yellow-50",
      green: "bg-green-50",
      red: "bg-red-50",
    };
    return map[color] || "bg-blue-50";
  };

  const renderNotesSection = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className=" rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-600 flex items-center gap-2">
              <i className="fas fa-thumbtack text-yellow-500"></i> Admin Notes
            </h3>
            {isAdmin && (
              <button
                className="text-sm px-3 py-1 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                onClick={() => setShowAdminInput(!showAdminInput)}
              >
                <i className="fas fa-plus text-xs mr-1"></i> Add Note
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {isLoadingNotes ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : adminNotes.length > 0 ? (
              adminNotes.map((note) => (
                <div
                  key={note._id || note.id}
                  className={`border-l-4 ${getColorClass(note.color)} bg-white-600 p-3 rounded-r-md relative group`}
                >
                  <div className="text-sm text-gray-600">{note.text}</div>
                  <div className="text-xs text-gray-400 mt-1 flex justify-between">
                    <span>{note.author || 'Admin'} · {note.date || new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {isAdmin && (
                    <button
                      className="absolute top-2 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteNote("admin", note._id || note.id)}
                    >
                          <i className="fas fa-trash"></i>

                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">
                No admin notes yet
              </p>
            )}
          </div>

          {showAdminInput && isAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <textarea
                className="w-full text-sm p-3 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                rows="2"
                placeholder="Type a note for faculty/staff..."
                value={adminNoteText}
                onChange={(e) => setAdminNoteText(e.target.value)}
              ></textarea>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex gap-1">
                  {["blue", "yellow", "green", "red"].map((color) => (
                    <div
                      key={color}
                      className={`w-5 h-5 rounded-full cursor-pointer border-2 ${adminNoteColor === color
                          ? "border-gray-700"
                          : "border-transparent"
                        }`}
                      style={{
                        background:
                          color === "blue"
                            ? "bg-blue-50"
                            : color === "yellow"
                              ? "#eda100"
                              : color === "green"
                                ? "#008300"
                                : "#e24b4a",
                      }}
                      onClick={() => setAdminNoteColor(color)}
                    ></div>
                  ))}
                </div>
                <button
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => handleSaveNote("admin")}
                >
                  Save
                </button>
                <button
                  className="text-sm px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    setShowAdminInput(false);
                    setAdminNoteText("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {isUser && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center">
                <i className="fas fa-info-circle mr-1"></i>
                You have read-only access to notes
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-600 flex items-center gap-2">
              <i className="fas fa-comment-dots text-blue-500"></i> Faculty Notes
            </h3>
            {isFaculty && (
              <button
                className="text-sm px-3 py-1 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                onClick={() => setShowFacultyInput(!showFacultyInput)}
              >
                <i className="fas fa-plus text-xs mr-1"></i> Add Note
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {isLoadingNotes ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : facultyNotes.length > 0 ? (
              facultyNotes.map((note) => (
                <div
                  key={note._id || note.id}
                  className={`border-l-4 ${getColorClass(note.color)} bg-white-600 p-3 rounded-r-md relative group`}

                >
                  <div className="text-sm text-gray-600">{note.text}</div>
                  <div className="text-xs text-gray-400 mt-1 flex justify-between">
                    <span>{note.author || 'Faculty'} · {note.date || new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {(isFaculty && note.authorRole === 'faculty') || isAdmin ? (
                    <button
                      className="absolute top-2 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteNote("faculty", note._id || note.id)}
                    >
    <i className="fas fa-trash"></i>

                    </button>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">
                No faculty notes yet
              </p>
            )}
          </div>

          {showFacultyInput && isFaculty && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <textarea
                className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                rows="2"
                placeholder="Leave a message or observation..."
                value={facultyNoteText}
                onChange={(e) => setFacultyNoteText(e.target.value)}
              ></textarea>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex gap-1">
                  {["blue", "yellow", "green", "red"].map((color) => (
                    <div
                      key={color}
                      className={`w-5 h-5 rounded-full cursor-pointer border-2 ${facultyNoteColor === color
                          ? "border-gray-700"
                          : "border-transparent"
                        }`}
                      style={{
                        background:
                          color === "blue"
                            ? "#2a78d6"
                            : color === "yellow"
                              ? "#eda100"
                              : color === "green"
                                ? "#008300"
                                : "#e24b4a",
                      }}
                      onClick={() => setFacultyNoteColor(color)}
                    ></div>
                  ))}
                </div>
                <button
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => handleSaveNote("faculty")}
                >
                  Save
                </button>
                <button
                  className="text-sm px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    setShowFacultyInput(false);
                    setFacultyNoteText("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isUser && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center">
                <i className="fas fa-info-circle mr-1"></i>
                You have read-only access to notes
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log('Current User Role:', userRole);
    console.log('Is Admin:', isAdmin);
    console.log('Is Faculty:', isFaculty);
    console.log('Is User:', isUser);
  }, [userRole]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-3"></i>
          <h3 className="text-lg font-semibold text-red-800 mb-2">{error}</h3>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const charts = dashboardData?.charts || {};
  const filteredActivities = getFilteredActivities();

  const kpis = [
    {
      id: "batches",
      label: "Batches",
      value: counts.batches,
      sub: "All Batches",
      icon: "fa-users",
      color: "#000000",
    },
    {
      id: "faculty",
      label: "Faculty",
      value: counts.faculty,
      sub: "Teaching staff",
      icon: "fa-chalkboard-teacher",
      color: "#534AB7",
    },
    {
      id: "students",
      label: "Students",
      value: counts.students,
      sub: "All batches",
      icon: "fa-user-graduate",
      color: "#1baf7a",
    },
    {
      id: "classrooms",
      label: "Classrooms",
      value: counts.classrooms,
      sub: `${stats.availableClassrooms || 0} Available`,
      icon: "fa-chalkboard",
      color: "#eda100",
    },
    {
      id: "subjects",
      label: "Subjects",
      value: counts.subjects,
      sub: "Core · Elective · Lab",
      icon: "fa-book",
      color: "#e34948",
    },
    {
      id: "timetables",
      label: "Timetables",
      value: counts.timetables,
      sub: "Present",
      icon: "fa-calendar-alt",
      color: "#e87ba4",
    },
  ];

  const firstRowKPIs = kpis.slice(0, 3);
  const secondRowKPIs = kpis.slice(3, 6);

  const colors = [
    "#2a78d6",
    "#534AB7",
    "#1baf7a",
    "#eda100",
    "#e34948",
    "#0ea5e9",
    "#8b5cf6",
    "#f97316",
  ];

  const departmentData =
    charts.facultyByDepartment?.map((dept, index) => ({
      dept: dept.department,
      count: dept.count,
      color: colors[index % colors.length],
    })) || [];

  const maxCount = Math.max(...departmentData.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8 pt-24">
          <div>
            <h1 className="text-4xl font-bold text-gray-600 mb-2">Dashboard</h1>
            <p className="text-lg text-gray-600">EduScheduler - PCE</p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="year">Last 12 months</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <i
                className={`fas fa-sync-alt ${refreshing ? "animate-spin" : ""}`}
              ></i>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {firstRowKPIs.map((kpi) => (
            <div
              key={kpi.id}
              className={`bg-white rounded-xl border p-4 transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:border-blue-400 hover:shadow-md ${selectedKPI === kpi.id
                  ? "border-2 border-blue-500 bg-blue-50"
                  : "border-gray-200"
                }`}
              onClick={() => setSelectedKPI(kpi.id)}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-600">{kpi.label}</span>
                <i
                  className={`fas ${kpi.icon} text-lg`}
                  style={{ color: kpi.color }}
                ></i>
              </div>
              <div className="text-2xl font-bold text-gray-600 mt-1">
                {kpi.value}
              </div>
              <div className="text-xs text-green-600 mt-1">{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {secondRowKPIs.map((kpi) => (
            <div
              key={kpi.id}
              className={`bg-white rounded-xl border p-4 transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:border-blue-400 hover:shadow-md ${selectedKPI === kpi.id
                  ? "border-2 border-blue-500 bg-blue-50"
                  : "border-gray-200"
                }`}
              onClick={() => setSelectedKPI(kpi.id)}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-600">{kpi.label}</span>
                <i
                  className={`fas ${kpi.icon} text-lg`}
                  style={{ color: kpi.color }}
                ></i>
              </div>
              <div className="text-2xl font-bold text-gray-600 mt-1">
                {kpi.value}
              </div>
              <div className="text-xs text-green-600 mt-1">{kpi.sub}</div>
            </div>
          ))}
        </div>

        <LeaveAlert />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-medium text-gray-600 mb-4">
              Faculty by department
            </h3>
            {departmentData.map((dept) => (
              <div key={dept.dept} className="flex items-center gap-3 mb-3">
                <span className="text-sm text-gray-600 w-40 flex-shrink-0">
                  {dept.dept}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(dept.count / maxCount) * 100}%`,
                      background: dept.color,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-400 w-6 text-right">
                  {dept.count}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-medium text-gray-600 mb-4">Recent activity</h3>
            <div className="flex gap-2 mb-4 flex-wrap">
              {["all", "faculty", "batch", "timetable"].map((filter) => (
                <button
                  key={filter}
                  className={`text-sm px-3 py-1 rounded-full border transition-colors ${activityFilter === filter
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-500 border border-gray-300 hover:bg-gray-50"
                    }`}
                  onClick={() => setActivityFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredActivities.length > 0 ? (
                filteredActivities.slice(0, 5).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-2 h-2 rounded-full mt-2 bg-purple-500 flex-shrink-0"></div>
                    <div className="flex-1 text-sm text-gray-600">
                      {activity.description}
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No activities found
                </p>
              )}
            </div>
          </div>
        </div>

        {renderNotesSection()}
      </div>

      {isReplacementModalOpen && selectedLeaveForReplacement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-t-xl">
              <h2 className="text-xl font-bold text-white">
                Assign Replacement Faculty
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Assign a replacement for{" "}
                {selectedLeaveForReplacement.facultyName}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                  <p>
                    <strong>Faculty:</strong>{" "}
                    {selectedLeaveForReplacement.facultyName}
                  </p>
                  <p>
                    <strong>Department:</strong>{" "}
                    {selectedLeaveForReplacement.department}
                  </p>
                  <p>
                    <strong>Leave Type:</strong>{" "}
                    {selectedLeaveForReplacement.leaveType}
                  </p>
                  <p>
                    <strong>Duration:</strong>{" "}
                    {new Date(
                      selectedLeaveForReplacement.fromDate,
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(
                      selectedLeaveForReplacement.toDate,
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {getLeaveStatus(selectedLeaveForReplacement)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Select Replacement Faculty *
                  </label>
                  {availableFacultyForReplacement.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableFacultyForReplacement.map((faculty) => (
                        <div
                          key={faculty._id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedReplacementFaculty?._id === faculty._id
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:bg-gray-50/2"
                            }`}
                          onClick={() => setSelectedReplacementFaculty(faculty)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-600">
                                {faculty.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {faculty.facultyId} · {faculty.department}
                              </p>
                            </div>
                            {selectedReplacementFaculty?._id ===
                              faculty._id && (
                                <i className="fas fa-check-circle text-purple-500 text-xl"></i>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <i className="fas fa-user-slash text-4xl text-gray-400 mb-2"></i>
                      <p className="text-gray-500">
                        No available faculty in same department
                      </p>
                    </div>
                  )}
                </div>

                {selectedReplacementFaculty && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      <i className="fas fa-check-circle mr-1"></i>
                      Selected: {selectedReplacementFaculty.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsReplacementModalOpen(false);
                  setSelectedLeaveForReplacement(null);
                  setSelectedReplacementFaculty(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignReplacement}
                disabled={!selectedReplacementFaculty || isSubmitting}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Assigning...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    Assign Replacement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;