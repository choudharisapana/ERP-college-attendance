import React, { useState, useEffect } from "react";
import { facultyAPI, leaveAPI, assignmentAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Faculty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const isFaculty = user?.role === "faculty";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedFacultyForLeave, setSelectedFacultyForLeave] = useState(null);
  const [selectedFacultyForAssign, setSelectedFacultyForAssign] =
    useState(null);
  const [activeTab, setActiveTab] = useState("faculty");

  // Form states
  const [newFaculty, setNewFaculty] = useState({
    name: "",
    email: "",
    department: "Computer Science",
    facultyId: "",
    subjects: "",
    workload: "",
    building: "",
    officeHours: "",
    phone: "",
  });

  const [leaveData, setLeaveData] = useState({
    facultyId: "",
    facultyName: "",
    department: "",
    leaveType: "Casual Leave",
    fromDate: "",
    toDate: "",
    reason: "",
    status: "Approved",
  });

  const [assignmentData, setAssignmentData] = useState({
    leaveId: "",
    assignedTo: "",
    lectureDate: "",
    lectureTime: "",
    subject: "",
    notes: "",
    duration: "1 hour",
  });

  // Constants
  const departments = [
    "Computer Science Engineering",
    "Information Technology",
    "Computer Technology",
    "Industrial-IOT",
    "Artificial Intelligence",
    "Civil Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Robotics",
  ];

  const leaveTypes = [
    "Casual Leave",
    "Sick Leave",
    "Annual Leave",
    "Earned Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Study Leave",
    "Other",
  ];

  const buildings = [
    "IT Building",
    "AIDS Building",
    "Mechanical Building",
    "Electrical Building",
    "Admin Building",
    "Chemical Building",
  ];

  useEffect(() => {
    if (!isAdmin && !isFaculty) {
      navigate("/dashboard");
      return;
    }
    fetchFaculty();
    fetchLeaveRequests();
    fetchAssignments();
  }, [isAdmin, isFaculty]);

  // Fetch functions
  const fetchFaculty = async () => {
    try {
      setLoading(true);
      setError(null);
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
      const errorMessage =
        err.response?.data?.message ||
        "Failed to fetch faculty. Please try again.";
      setError(errorMessage);
      console.error("Error fetching faculty:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await leaveAPI.getAll();
      let leaveData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          leaveData = response.data.data;
        } else if (Array.isArray(response.data)) {
          leaveData = response.data;
        }
      }
      setLeaveRequests(leaveData);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await assignmentAPI.getAll();
      let assignmentData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          assignmentData = response.data.data;
        } else if (Array.isArray(response.data)) {
          assignmentData = response.data;
        }
      }
      setAssignments(assignmentData);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  const getFacultyLeaveStatus = (facultyId) => {
    if (!facultyId) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      leaveRequests.find((leave) => {
        const from = new Date(leave.fromDate);
        const to = new Date(leave.toDate);

        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        return (
          leave.facultyId?.toString() === facultyId?.toString() &&
          leave.status === "Approved" &&
          today >= from &&
          today <= to
        );
      }) || null
    );
  };

  const getFacultyById = (facultyId) => {
    return facultyMembers.find(
      (f) => f._id === facultyId || f.facultyId === facultyId,
    );
  };

  const getAvailableFaculty = (leaveFacultyId, lectureDate, lectureTime) => {
    return facultyMembers.filter((f) => {
      if (f._id === leaveFacultyId || f.facultyId === leaveFacultyId)
        return false;

      const existingAssignment = assignments.find(
        (a) =>
          a.assignedTo === f._id &&
          a.lectureDate === lectureDate &&
          a.lectureTime === lectureTime &&
          a.status !== "Completed",
      );

      return !existingAssignment;
    });
  };

  const formatSubjects = (subjects) => {
    if (!subjects) return "";
    if (Array.isArray(subjects)) return subjects.join(", ");
    if (typeof subjects === "string") return subjects;
    return "";
  };

  const prepareSubjects = (subjectsString) => {
    if (!subjectsString || typeof subjectsString !== "string") return [];
    return subjectsString
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  // Filter faculty
  const filteredFaculty = facultyMembers.filter((faculty) => {
    if (!faculty || typeof faculty !== "object") return false;

    const name = faculty.name || "";
    const email = faculty.email || "";
    const facultyId = faculty.facultyId || "";
    const facultySubjects = faculty.subjects || [];

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facultyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(facultySubjects) &&
        facultySubjects.some((subject) =>
          subject?.toLowerCase().includes(searchTerm.toLowerCase()),
        ));

    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      faculty.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("All Departments");
  };

  //Faculty CRUD operations
  const handleAddFaculty = async () => {
    if (!isAdmin) {
      alert("You don't have permission to add faculty");
      return;
    }

    if (!newFaculty.name.trim()) {
      alert("Please enter faculty name");
      return;
    }
    if (!newFaculty.email.trim()) {
      alert("Please enter faculty email");
      return;
    }
    if (!newFaculty.facultyId.trim()) {
      alert("Please enter faculty ID");
      return;
    }
    if (!newFaculty.workload || isNaN(parseInt(newFaculty.workload))) {
      alert("Please enter a valid workload number");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const facultyData = {
        name: newFaculty.name.trim(),
        email: newFaculty.email.trim(),
        department: newFaculty.department,
        facultyId: newFaculty.facultyId.trim(),
        workload: parseInt(newFaculty.workload),
        building: newFaculty.building || "",
        officeHours: newFaculty.officeHours || "",
        phone: newFaculty.phone || "",
        subjects: prepareSubjects(newFaculty.subjects),
      };

      await facultyAPI.create(facultyData);
      await fetchFaculty();

      setNewFaculty({
        name: "",
        email: "",
        department: "Computer Science",
        facultyId: "",
        subjects: "",
        workload: "",
        building: "",
        officeHours: "",
        phone: "",
      });

      setIsAddModalOpen(false);
      alert("Faculty added successfully!");
    } catch (err) {
      console.error("Error adding faculty:", err);
      let errorMessage = "Failed to add faculty. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setApiError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  //Edit Faculty
  const handleEditFaculty = async () => {
    if (!isAdmin) {
      alert("You don't have permission to edit faculty");
      return;
    }

    if (!editingFaculty) return;

    if (!editingFaculty.name?.trim()) {
      alert("Please enter faculty name");
      return;
    }
    if (!editingFaculty.email?.trim()) {
      alert("Please enter faculty email");
      return;
    }
    if (!editingFaculty.facultyId?.trim()) {
      alert("Please enter faculty ID");
      return;
    }
    if (!editingFaculty.workload || isNaN(parseInt(editingFaculty.workload))) {
      alert("Please enter a valid workload number");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const facultyData = {
        name: editingFaculty.name.trim(),
        email: editingFaculty.email.trim(),
        department: editingFaculty.department,
        facultyId: editingFaculty.facultyId.trim(),
        workload: parseInt(editingFaculty.workload),
        building: editingFaculty.building || "",
        officeHours: editingFaculty.officeHours || "",
        phone: editingFaculty.phone || "",
        subjects: prepareSubjects(editingFaculty.subjects),
      };

      await facultyAPI.update(editingFaculty._id, facultyData);
      await fetchFaculty();

      setIsEditModalOpen(false);
      setEditingFaculty(null);
      alert("Faculty updated successfully!");
    } catch (err) {
      console.error("Error updating faculty:", err);
      let errorMessage = "Failed to update faculty. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setApiError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  //Delete Faculty
  const handleDeleteFaculty = async (id) => {
    if (!isAdmin) {
      alert("You don't have permission to delete faculty");
      return;
    }

    if (!id) {
      alert("Invalid faculty ID");
      return;
    }

    if (
      !window.confirm("Are you sure you want to delete this faculty member?")
    ) {
      return;
    }

    try {
      await facultyAPI.delete(id);
      await fetchFaculty();
      alert("Faculty deleted successfully!");
    } catch (err) {
      console.error("Error deleting faculty:", err);
      let errorMessage = "Failed to delete faculty. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      alert(`Error: ${errorMessage}`);
    }
  };

  // Leave Management Functions
  const openLeaveModal = (faculty) => {
    const leaveStatus = getFacultyLeaveStatus(faculty.facultyId || faculty._id);
    if (leaveStatus) {
      alert("This faculty member is already on leave!");
      return;
    }

    setSelectedFacultyForLeave(faculty);
    setLeaveData({
      facultyId: faculty.facultyId || faculty._id,
      facultyName: faculty.name,
      department: faculty.department,
      leaveType: "Casual Leave",
      fromDate: "",
      toDate: "",
      reason: "",
      status: "Approved",
    });
    setIsLeaveModalOpen(true);
  };

  const handleLeaveInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyLeave = async () => {
    if (!leaveData.facultyId) {
      alert("Please select a faculty member");
      return;
    }
    if (!leaveData.fromDate) {
      alert("Please select start date");
      return;
    }
    if (!leaveData.toDate) {
      alert("Please select end date");
      return;
    }
    if (new Date(leaveData.fromDate) > new Date(leaveData.toDate)) {
      alert("Start date cannot be after end date");
      return;
    }
    if (!leaveData.reason.trim()) {
      alert("Please provide a reason for leave");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      await leaveAPI.create(leaveData);
      await Promise.all([fetchLeaveRequests(), fetchFaculty()]);

      // Set flag for dashboard refresh
      localStorage.setItem("dashboardRefresh", Date.now().toString());

      setIsLeaveModalOpen(false);
      setSelectedFacultyForLeave(null);
      setLeaveData({
        facultyId: "",
        facultyName: "",
        department: "",
        leaveType: "Casual Leave",
        fromDate: "",
        toDate: "",
        reason: "",
        status: "Approved",
      });

      alert("Leave applied successfully!");
    } catch (err) {
      console.error("Error applying for leave:", err);
      let errorMessage =
        "Failed to submit leave application. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setApiError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  //Assignment Management Functions 
  const openAssignModal = (faculty) => {
    if (!isAdmin) {
      alert("You don't have permission to assign lectures");
      return;
    }

    const leaveStatus = getFacultyLeaveStatus(faculty.facultyId || faculty._id);
    if (!leaveStatus) {
      alert("This faculty member is not currently on approved leave.");
      return;
    }

    const existingAssignment = assignments.find(
      (a) => a.leaveId === leaveStatus._id && a.status !== "Completed",
    );
    if (existingAssignment) {
      alert("A lecture has already been assigned for this leave.");
      return;
    }

    setSelectedFacultyForAssign(faculty);
    setAssignmentData({
      leaveId: leaveStatus._id,
      assignedTo: "",
      lectureDate: new Date().toISOString().split("T")[0],
      lectureTime: "09:00",
      subject: faculty.subjects?.[0] || "",
      notes: "",
      duration: "1 hour",
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignmentInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssignLecture = async () => {
    if (!isAdmin) {
      alert("You don't have permission to assign lectures");
      return;
    }

    if (!assignmentData.assignedTo) {
      alert("Please select a faculty member to assign the lecture.");
      return;
    }
    if (!assignmentData.lectureDate) {
      alert("Please select a date for the lecture.");
      return;
    }
    if (!assignmentData.lectureTime) {
      alert("Please select a time for the lecture.");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const faculty = selectedFacultyForAssign;
      const leaveStatus = getFacultyLeaveStatus(
        faculty.facultyId || faculty._id,
      );

      const assignmentPayload = {
        leaveId: leaveStatus._id,
        leaveFacultyId: faculty.facultyId || faculty._id,
        leaveFacultyName: faculty.name,
        assignedTo: assignmentData.assignedTo,
        assignedToName:
          getFacultyById(assignmentData.assignedTo)?.name || "Unknown",
        lectureDate: assignmentData.lectureDate,
        lectureTime: assignmentData.lectureTime,
        subject: assignmentData.subject || "General",
        notes: assignmentData.notes,
        duration: assignmentData.duration,
        status: "Assigned",
        department: faculty.department,
        assignedBy: user?.name || "Admin",
        assignedDate: new Date().toISOString(),
      };

      await assignmentAPI.create(assignmentPayload);

      await leaveAPI.update(leaveStatus._id, {
        ...leaveStatus,
        status: "Assigned",
      });

      await Promise.all([fetchLeaveRequests(), fetchAssignments()]);

      setIsAssignModalOpen(false);
      setSelectedFacultyForAssign(null);
      setAssignmentData({
        leaveId: "",
        assignedTo: "",
        lectureDate: "",
        lectureTime: "",
        subject: "",
        notes: "",
        duration: "1 hour",
      });

      alert("Lecture assigned successfully!");
    } catch (err) {
      console.error("Error assigning lecture:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to assign lecture. Please try again.";
      setApiError(errorMsg);
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  //Complete Assignment
  const handleCompleteAssignment = async (assignmentId) => {
    if (!isAdmin) {
      alert("You don't have permission to complete assignments");
      return;
    }

    if (!window.confirm("Mark this assignment as completed?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const assignment = assignments.find((a) => a._id === assignmentId);
      if (!assignment) {
        alert("Assignment not found");
        return;
      }

      await assignmentAPI.update(assignmentId, {
        ...assignment,
        status: "Completed",
        completedDate: new Date().toISOString(),
      });

      if (assignment.leaveId) {
        const leave = leaveRequests.find((l) => l._id === assignment.leaveId);
        if (leave) {
          await leaveAPI.update(assignment.leaveId, {
            ...leave,
            status: "Completed",
          });
        }
      }

      await Promise.all([fetchLeaveRequests(), fetchAssignments()]);
      alert("Assignment marked as completed!");
    } catch (err) {
      console.error("Error completing assignment:", err);
      alert("Failed to complete assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (faculty) => {
    if (!isAdmin) {
      alert("You don't have permission to edit faculty");
      return;
    }

    if (!faculty || !faculty._id) {
      alert("Invalid faculty data");
      return;
    }

    setEditingFaculty({
      ...faculty,
      subjects: formatSubjects(faculty.subjects),
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsLeaveModalOpen(false);
    setIsAssignModalOpen(false);
    setEditingFaculty(null);
    setSelectedFacultyForLeave(null);
    setSelectedFacultyForAssign(null);
    setApiError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFaculty((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingFaculty((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading && facultyMembers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading faculty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-24 text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-600 mb-2">
            Faculty Management
          </h1>
          <p className="text-lg text-gray-600">
            {isAdmin
              ? "Manage faculty members, workloads, and teaching assignments"
              : "View faculty members and apply for leave"}
          </p>
        </div>

        {apiError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <div className="flex justify-between items-center">
              <span>{apiError}</span>
              <button
                onClick={() => setApiError(null)}
                className="text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {activeTab === "faculty" || !isAdmin ? (
          <>
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor="search"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Search faculty...
                  </label>
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by name, email, faculty ID, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Department
                  </label>
                  <select
                    id="department"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All Departments">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Faculty
                  </button>
                )}
              </div>
            </div>

            {/*Error State*/}
            {error && facultyMembers.length === 0 && (
              <div className="text-center py-12">
                <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {error}
                </h3>
                <button
                  onClick={fetchFaculty}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Retry Loading
                </button>
              </div>
            )}

            {!error && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredFaculty.map((faculty) => {
                  const leaveStatus = getFacultyLeaveStatus(
                    faculty.facultyId || faculty._id,
                  );
                  const hasAssignment = assignments.some(
                    (a) =>
                      a.leaveFacultyId === (faculty.facultyId || faculty._id) &&
                      a.status !== "Completed",
                  );

                  return (
                    <div
                      key={faculty._id || faculty.id}
                      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300`}
                    >
                      <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {faculty.name || "No Name"}
                            </h3>
                            <p className="text-blue-100 mt-1">
                              {faculty.facultyId || "No ID"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-semibold">
                              {faculty.department || "No Department"}
                            </span>
                            {isAdmin && hasAssignment && (
                              <span className="mt-1 px-2 py-1 bg-blue-700 text-white rounded-full text-xs font-semibold">
                                Lecture Assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <i className="fas fa-envelope text-gray-400 w-5"></i>
                            <span className="ml-2 text-gray-600">
                              <strong>Email:</strong>{" "}
                              {faculty.email || "No email"}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <i className="fas fa-building text-gray-400 w-5"></i>
                            <span className="ml-2 text-gray-600">
                              <strong>Building:</strong>{" "}
                              {faculty.building || "Not assigned"}
                            </span>
                          </div>

                          {faculty.phone && (
                            <div className="flex items-center">
                              <i className="fas fa-phone text-gray-400 w-5"></i>
                              <span className="ml-2 text-gray-600">
                                <strong>Mobile:</strong> {faculty.phone}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center">
                            <i className="fas fa-clock text-gray-400 w-5"></i>
                            <span className="ml-2 text-gray-600">
                              <strong>Workload:</strong> {faculty.workload || 0}{" "}
                              hours/week
                            </span>
                          </div>

                          {faculty.subjects && faculty.subjects.length > 0 && (
                            <div className="flex items-start">
                              <i className="fas fa-book text-gray-400 w-5 mt-1"></i>
                              <div className="ml-2">
                                <strong className="text-gray-600">
                                  Subjects:
                                </strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Array.isArray(faculty.subjects) ? (
                                    faculty.subjects.map((subject, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                      >
                                        {subject}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                      {faculty.subjects}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        </div>

                        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-200">
                          {isFaculty ? (
                            <button
                              onClick={() => openLeaveModal(faculty)}
                              className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 transition-colors flex items-center justify-center ${
                                leaveStatus
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
                              }`}
                              disabled={isSubmitting || leaveStatus !== null}
                              title={
                                leaveStatus
                                  ? "Faculty is already on leave"
                                  : "Apply for leave"
                              }
                            >
                              <i className="fas fa-calendar-check mr-2"></i>
                              {leaveStatus ? "On Leave" : "Apply Leave"}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openLeaveModal(faculty)}
                                className={`flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 transition-colors flex items-center justify-center ${
                                  leaveStatus
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
                                }`}
                                disabled={isSubmitting || leaveStatus !== null}
                                title={
                                  leaveStatus
                                    ? "Faculty is already on leave"
                                    : "Apply for leave"
                                }
                              >
                                <i className="fas fa-calendar-check mr-2"></i>
                                {leaveStatus ? "On Leave" : "Apply Leave"}
                              </button>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openEditModal(faculty)}
                                  className="px-4 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Edit"
                                  disabled={isSubmitting}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteFaculty(faculty._id)
                                  }
                                  className="px-4 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete"
                                  disabled={isSubmitting}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!error &&
              filteredFaculty.length === 0 &&
              facultyMembers.length > 0 && (
                <div className="text-center py-12">
                  <i className="fas fa-user-graduate text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-600">
                    No faculty members found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}

            {!error && facultyMembers.length === 0 && (
              <div className="text-center py-12">
                <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600">
                  No faculty members yet
                </h3>
                <p className="text-gray-500">
                  {isAdmin
                    ? "Add your first faculty member using the blue button"
                    : "No faculty members available"}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <i className="fas fa-tasks text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600">
                  No assignments yet
                </h3>
                <p className="text-gray-500">
                  When faculty members go on approved leave, you can assign
                  their lectures here
                </p>
              </div>
            ) : (
              assignments.map((assignment) => {
                const leave = leaveRequests.find(
                  (l) => l._id === assignment.leaveId,
                );
                const assignedFaculty = getFacultyById(assignment.assignedTo);

                return (
                  <div
                    key={assignment._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="p-6">
                      <div className="flex flex-wrap items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-800">
                              {assignment.leaveFacultyName || "Unknown Faculty"}{" "}
                              → {assignment.assignedToName || "Unassigned"}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                assignment.status === "Assigned"
                                  ? "bg-blue-100 text-blue-800"
                                  : assignment.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {assignment.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                            <div>
                              <i className="fas fa-calendar text-gray-400 mr-2"></i>
                              <strong>Date:</strong>{" "}
                              {new Date(
                                assignment.lectureDate,
                              ).toLocaleDateString()}
                            </div>
                            <div>
                              <i className="fas fa-clock text-gray-400 mr-2"></i>
                              <strong>Time:</strong> {assignment.lectureTime}
                            </div>
                            <div>
                              <i className="fas fa-book text-gray-400 mr-2"></i>
                              <strong>Subject:</strong>{" "}
                              {assignment.subject || "General"}
                            </div>
                            <div>
                              <i className="fas fa-hourglass-half text-gray-400 mr-2"></i>
                              <strong>Duration:</strong> {assignment.duration}
                            </div>
                          </div>

                          {assignment.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <i className="fas fa-sticky-note text-gray-400 mr-2"></i>
                              <strong>Notes:</strong> {assignment.notes}
                            </div>
                          )}

                          {leave && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                              <p className="text-gray-600">
                                <strong>Leave Details:</strong>{" "}
                                {leave.leaveType} from{" "}
                                {new Date(leave.fromDate).toLocaleDateString()}{" "}
                                to {new Date(leave.toDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                          {assignment.status === "Assigned" && (
                            <button
                              onClick={() =>
                                handleCompleteAssignment(assignment._id)
                              }
                              disabled={isSubmitting}
                              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
                            >
                              <i className="fas fa-check mr-2"></i>
                              Mark Complete
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const faculty = facultyMembers.find(
                                (f) =>
                                  f._id === assignment.leaveFacultyId ||
                                  f.facultyId === assignment.leaveFacultyId,
                              );
                              if (faculty) {
                                setActiveTab("faculty");
                                setSearchTerm(faculty.name);
                              }
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                          >
                            <i className="fas fa-user mr-2"></i>
                            View Faculty
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
                          <div>
                            <i className="fas fa-calendar-plus text-gray-400 mr-2"></i>
                            <span>
                              Assigned:{" "}
                              {new Date(
                                assignment.assignedDate,
                              ).toLocaleString()}
                            </span>
                          </div>
                          {assignment.completedDate && (
                            <div>
                              <i className="fas fa-check-circle text-green-500 mr-2"></i>
                              <span>
                                Completed:{" "}
                                {new Date(
                                  assignment.completedDate,
                                ).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {isAddModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Add New Faculty</h2>
              <p className="text-blue-100 mt-1">Enter faculty member details</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newFaculty.name}
                      onChange={handleInputChange}
                      placeholder="Dr. John Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newFaculty.email}
                      onChange={handleInputChange}
                      placeholder="john.smith@university.edu"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={newFaculty.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Faculty ID *
                    </label>
                    <input
                      type="text"
                      name="facultyId"
                      value={newFaculty.facultyId}
                      onChange={handleInputChange}
                      placeholder="e.g., FAC001, CS101, 2023001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Subjects
                  </label>
                  <input
                    type="text"
                    name="subjects"
                    value={newFaculty.subjects}
                    onChange={handleInputChange}
                    placeholder="Data Structures, Algorithms, Web Development"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate subjects with commas
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Building
                    </label>
                    <select
                      name="building"
                      value={newFaculty.building}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <option value="">Select Building</option>
                      {buildings.map((building) => (
                        <option key={building} value={building}>
                          {building}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={newFaculty.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Workload (hours/week) *
                  </label>
                  <input
                    type="number"
                    name="workload"
                    value={newFaculty.workload}
                    onChange={handleInputChange}
                    placeholder="12"
                    min="0"
                    max="40"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddFaculty}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Adding...
                  </>
                ) : (
                  "Add Faculty"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Edit Faculty Modal*/}
      {isEditModalOpen && editingFaculty && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Edit Faculty</h2>
              <p className="text-blue-100 mt-1">Update faculty information</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editingFaculty.name || ""}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editingFaculty.email || ""}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={editingFaculty.department || ""}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Faculty ID *
                    </label>
                    <input
                      type="text"
                      name="facultyId"
                      value={editingFaculty.facultyId || ""}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Subjects
                  </label>
                  <input
                    type="text"
                    name="subjects"
                    value={editingFaculty.subjects || ""}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate subjects with commas
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Building
                    </label>
                    <select
                      name="building"
                      value={editingFaculty.building || ""}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <option value="">Select Building</option>
                      {buildings.map((building) => (
                        <option key={building} value={building}>
                          {building}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={editingFaculty.phone || ""}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Workload (hours/week) *
                  </label>
                  <input
                    type="number"
                    name="workload"
                    value={editingFaculty.workload || ""}
                    onChange={handleEditInputChange}
                    min="0"
                    max="40"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleEditFaculty}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Updating...
                  </>
                ) : (
                  "Update Faculty"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Apply Leave Modal*/}
      {isLeaveModalOpen && selectedFacultyForLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Apply for Leave</h2>
              <p className="text-green-100 mt-1">
                Submit leave application for {selectedFacultyForLeave.name}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Faculty Name
                  </label>
                  <input
                    type="text"
                    value={leaveData.facultyName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={leaveData.department}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Leave Type *
                  </label>
                  <select
                    name="leaveType"
                    value={leaveData.leaveType}
                    onChange={handleLeaveInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      From Date *
                    </label>
                    <input
                      type="date"
                      name="fromDate"
                      value={leaveData.fromDate}
                      onChange={handleLeaveInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      To Date *
                    </label>
                    <input
                      type="date"
                      name="toDate"
                      value={leaveData.toDate}
                      onChange={handleLeaveInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Reason for Leave *
                  </label>
                  <textarea
                    name="reason"
                    value={leaveData.reason}
                    onChange={handleLeaveInputChange}
                    placeholder="Please provide a detailed reason for your leave request..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyLeave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Apply Leave
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Assign Lecture Modal*/}
      {isAssignModalOpen && selectedFacultyForAssign && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Assign Lecture</h2>
              <p className="text-blue-100 mt-1">
                Assign lecture for {selectedFacultyForAssign.name}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Faculty:</span>
                      <span className="ml-2 font-medium">
                        {selectedFacultyForAssign.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Department:</span>
                      <span className="ml-2 font-medium">
                        {selectedFacultyForAssign.department}
                      </span>
                    </div>
                    {getFacultyLeaveStatus(
                      selectedFacultyForAssign.facultyId ||
                        selectedFacultyForAssign._id,
                    ) && (
                      <>
                        <div>
                          <span className="text-gray-500">Leave Type:</span>
                          <span className="ml-2 font-medium">
                            {
                              getFacultyLeaveStatus(
                                selectedFacultyForAssign.facultyId ||
                                  selectedFacultyForAssign._id,
                              ).leaveType
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Leave Duration:</span>
                          <span className="ml-2 font-medium">
                            {new Date(
                              getFacultyLeaveStatus(
                                selectedFacultyForAssign.facultyId ||
                                  selectedFacultyForAssign._id,
                              ).fromDate,
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              getFacultyLeaveStatus(
                                selectedFacultyForAssign.facultyId ||
                                  selectedFacultyForAssign._id,
                              ).toDate,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Assign To *
                  </label>
                  <select
                    name="assignedTo"
                    value={assignmentData.assignedTo}
                    onChange={handleAssignmentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    <option value="">Select Faculty Member</option>
                    {getAvailableFaculty(
                      selectedFacultyForAssign._id,
                      assignmentData.lectureDate,
                      assignmentData.lectureTime,
                    ).map((faculty) => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.name} - {faculty.department}
                        {faculty.workload && ` (${faculty.workload}h/week)`}
                      </option>
                    ))}
                  </select>
                  {getAvailableFaculty(
                    selectedFacultyForAssign._id,
                    assignmentData.lectureDate,
                    assignmentData.lectureTime,
                  ).length === 0 && (
                    <p className="mt-1 text-sm text-red-500">
                      No available faculty members for this time slot
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="lectureDate"
                      value={assignmentData.lectureDate}
                      onChange={handleAssignmentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Time *
                    </label>
                    <input
                      type="time"
                      name="lectureTime"
                      value={assignmentData.lectureTime}
                      onChange={handleAssignmentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={assignmentData.subject}
                    onChange={handleAssignmentInputChange}
                    placeholder="Enter subject or course name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Duration
                  </label>
                  <select
                    name="duration"
                    value={assignmentData.duration}
                    onChange={handleAssignmentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    <option value="30 minutes">30 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="1.5 hours">1.5 hours</option>
                    <option value="2 hours">2 hours</option>
                    <option value="3 hours">3 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={assignmentData.notes}
                    onChange={handleAssignmentInputChange}
                    placeholder="Any additional instructions or notes for the assigned faculty..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignLecture}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Assigning...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Assign Lecture
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

export default Faculty;