import React, { useState, useEffect } from "react";
import { facultyAPI } from "../../services/api";

const Faculty = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [newFaculty, setNewFaculty] = useState({
    name: "",
    email: "",
    department: "Computer Science",
    facultyId: "", // Added facultyId field
    subjects: "",
    workload: "",
    building: "",
    officeHours: "",
    phone: "",
  });

  const departments = [
    'Computer Science Engineering', 'Information Technology', 'Computer Technology', 
    'Industrial-IOT', 'Artificial Intelligence', 'Civil Engineering', 'Electrical Engineering', 
    'Mechanical Engineering', 'Robotics',
  ];
  const buildings = [
    "IT Building",
    "AIDS Building",
    "Mechanical Building",
    "Electrical Building",
    "Admin Building",
    "Chemical Building",
  ];

  // Fetch faculty from API
  const fetchFaculty = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await facultyAPI.getAll();

      // Handle different response structures
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

  useEffect(() => {
    fetchFaculty();
  }, []);

  // Filter faculty based on search and department
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
          subject?.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      faculty.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  // Clear filters function
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("All Departments");
  };

  // Helper function to format subjects for display
  const formatSubjects = (subjects) => {
    if (!subjects) return "";
    if (Array.isArray(subjects)) return subjects.join(", ");
    if (typeof subjects === "string") return subjects;
    return "";
  };

  // Helper function to prepare subjects for API
  const prepareSubjects = (subjectsString) => {
    if (!subjectsString || typeof subjectsString !== "string") return [];
    return subjectsString
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  // Add Faculty Functionality
  const handleAddFaculty = async () => {
    // Validate required fields
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
      // Prepare data for API
      const facultyData = {
        name: newFaculty.name.trim(),
        email: newFaculty.email.trim(),
        department: newFaculty.department,
        facultyId: newFaculty.facultyId.trim(), // Include facultyId
        workload: parseInt(newFaculty.workload),
        building: newFaculty.building || "",
        officeHours: newFaculty.officeHours || "",
        phone: newFaculty.phone || "",
        subjects: prepareSubjects(newFaculty.subjects),
      };

      console.log("Adding faculty with data:", facultyData);

      const response = await facultyAPI.create(facultyData);
      console.log("Faculty added successfully:", response.data);

      // Refresh the list
      await fetchFaculty();

      // Reset form
      setNewFaculty({
        name: "",
        email: "",
        department: "Computer Science",
        facultyId: "", // Reset facultyId
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

      // Extract error message
      let errorMessage = "Failed to add faculty. Please try again.";

      if (err.response?.data) {
        // Handle validation errors
        if (err.response.data.errors) {
          const errors = err.response.data.errors;
          errorMessage = Object.values(errors)
            .map((error) => error.message || error)
            .join("\n");
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setApiError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Faculty Functionality
  const handleEditFaculty = async () => {
    if (!editingFaculty) return;

    // Validate required fields
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
      // Prepare data for API
      const facultyData = {
        name: editingFaculty.name.trim(),
        email: editingFaculty.email.trim(),
        department: editingFaculty.department,
        facultyId: editingFaculty.facultyId.trim(), // Include facultyId
        workload: parseInt(editingFaculty.workload),
        building: editingFaculty.building || "",
        officeHours: editingFaculty.officeHours || "",
        phone: editingFaculty.phone || "",
        subjects: prepareSubjects(editingFaculty.subjects),
      };

      console.log("Updating faculty with data:", facultyData);

      const response = await facultyAPI.update(editingFaculty._id, facultyData);
      console.log("Faculty updated successfully:", response.data);

      // Refresh the list
      await fetchFaculty();

      setIsEditModalOpen(false);
      setEditingFaculty(null);
      alert("Faculty updated successfully!");
    } catch (err) {
      console.error("Error updating faculty:", err);

      // Extract error message
      let errorMessage = "Failed to update faculty. Please try again.";

      if (err.response?.data) {
        if (err.response.data.errors) {
          const errors = err.response.data.errors;
          errorMessage = Object.values(errors)
            .map((error) => error.message || error)
            .join("\n");
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setApiError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Faculty Functionality
  const handleDeleteFaculty = async (id) => {
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
      console.log("Deleting faculty with ID:", id);
      const response = await facultyAPI.delete(id);
      console.log("Faculty deleted successfully:", response.data);

      // Refresh the list
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

  // Open Edit Modal
  const openEditModal = (faculty) => {
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

  // Close Modals
  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingFaculty(null);
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

  // Loading state
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
      {/* Main Content with extra top padding to avoid navbar overlap */}
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="pt-24 text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-600 mb-2">
            Faculty Management
          </h1>
          <p className="text-lg text-gray-600">
            Manage faculty members, workloads, and teaching assignments
          </p>
        </div>

        {/* Error Display */}
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

        {/* Search and Filters Section */}
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
            <button
              onClick={() => setIsAddModalOpen(true)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Faculty
            </button>
          </div>
        </div>

        {/* Error State */}
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

        {/* Faculty Grid */}
        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFaculty.map((faculty) => (
              <div
                key={faculty._id || faculty.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-white">
                      {faculty.facultyId || "No Name"}
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {faculty.building || "No Department"}
                    </span>
                  </div>
                  <p className="text-blue-100 mt-1">
                    {faculty.name || "No building assigned"}
                  </p>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <i className="fas fa-envelope text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                      <strong>Email:</strong> {faculty.email || "No email"}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <i className="fas fa-id-card text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Department:</strong> {faculty.department || "Not assigned"}
                      </span>
                    </div>

                    {faculty.phone && (
                      <div className="flex items-center">
                        <i className="fas fa-phone text-gray-400 w-5"></i>
                        <span className="ml-2 text-gray-600">
                          <strong>Mobile No:</strong> {faculty.phone}
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
                          <strong className="text-gray-600">Subjects:</strong>
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
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {faculty.subjects}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {faculty.officeHours && (
                      <div className="flex items-center">
                        <i className="fas fa-door-open text-gray-400 w-5"></i>
                        <span className="ml-2 text-gray-700">
                          <strong>Office Hours:</strong> {faculty.officeHours}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openEditModal(faculty)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFaculty(faculty._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
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

        {/* No Faculty State */}
        {!error && facultyMembers.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600">
              No faculty members yet
            </h3>
            <p className="text-gray-500">
             Add your first subject using the blue button
            </p>
          </div>
        )}
      </div>

      {/* Add New Faculty Modal */}
      {isAddModalOpen && (
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

      {/* Edit Faculty Modal */}
      {isEditModalOpen && editingFaculty && (
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
    </div>
  );
};

export default Faculty;