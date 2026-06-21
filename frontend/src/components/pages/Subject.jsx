import React, { useState, useEffect } from "react";
import { subjectAPI } from "../../services/api";

const Subject = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedSemester, setSelectedSemester] = useState("All Semesters");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    department: "Computer Science Engineering",
    credits: "",
    type: "Core",
    semester: "Semester 1",
    description: "",
  });

  // Departments and types for dropdowns
  const departments = [
    'Computer Science Engineering', 'Information Technology', 'Computer Technology', 
    'Industrial-IOT', 'Artificial Intelligence', 'Civil Engineering', 'Electrical Engineering', 
    'Mechanical Engineering', 'Robotics'
  ];
  
  const types = ["Core", "Elective", "Lab", "MDM", "PEC","Project", "Workshop", "Seminar"];
  const semesters = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", 
                     "Semester 5", "Semester 6", "Semester 7", "Semester 8"];

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subjectAPI.getAll();
      
      // Handle different response structures
      let subjectsData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          subjectsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          subjectsData = response.data;
        }
      }
      
      setSubjects(subjectsData);
    } catch (err) {
      const errorMessage = 
        err.response?.data?.message || 
        "Failed to fetch subjects. Please try again.";
      setError(errorMessage);
      console.error("Error fetching subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Filter subjects
  const filteredSubjects = subjects.filter((subject) => {
    if (!subject || typeof subject !== "object") return false;
    
    const name = subject.name || "";
    const code = subject.code || "";
    const subjectDepartment = subject.department || "";
    const subjectType = subject.type || "";
    const subjectSemester = subject.semester || "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      subjectDepartment === selectedDepartment;

    const matchesType =
      selectedType === "All Types" || 
      subjectType === selectedType;

    const matchesSemester =
      selectedSemester === "All Semesters" || 
      subjectSemester === selectedSemester;

    return matchesSearch && matchesDepartment && matchesType && matchesSemester;
  });

  // Clear filters function
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("All Departments");
    setSelectedType("All Types");
    setSelectedSemester("All Semesters");
  };

  // Delete subject function with confirmation
  const handleDeleteSubject = async (id) => {
    if (!id) {
      alert("Invalid subject ID");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this subject?")) {
      return;
    }

    try {
      await subjectAPI.delete(id);
      await fetchSubjects();
      alert("Subject deleted successfully!");
    } catch (err) {
      let errorMessage = "Failed to delete subject. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      alert(`Error: ${errorMessage}`);
    }
  };

  // Open Edit Modal
  const openEditModal = (subject) => {
    if (!subject || !subject._id) {
      alert("Invalid subject data");
      return;
    }

    setEditingSubject(subject);
    setNewSubject({
      name: subject.name || "",
      code: subject.code || "",
      department: subject.department || "Computer Science Engineering",
      credits: subject.credits ? subject.credits.toString() : "",
      type: subject.type || "Core",
      semester: subject.semester || "Semester 1",
      description: subject.description || "",
    });
    setIsEditModalOpen(true);
    setApiError(null);
  };

  // Close Modals
  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingSubject(null);
    setApiError(null);
  };

  // Handle input changes for Add Modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSubject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add Subject Functionality
  const handleAddSubject = async () => {
    // Validate required fields
    if (!newSubject.name.trim()) {
      alert("Please enter subject name");
      return;
    }
    if (!newSubject.code.trim()) {
      alert("Please enter subject code");
      return;
    }
    if (!newSubject.credits || isNaN(parseInt(newSubject.credits))) {
      alert("Please enter valid credits");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Prepare data for API
      const subjectData = {
        name: newSubject.name.trim(),
        code: newSubject.code.trim(),
        department: newSubject.department,
        credits: parseInt(newSubject.credits),
        type: newSubject.type,
        semester: newSubject.semester,
        description: newSubject.description || "",
        status: true,
      };

      await subjectAPI.create(subjectData);
      await fetchSubjects();
      setNewSubject({
        name: "",
        code: "",
        department: "Computer Science Engineering",
        credits: "",
        type: "Core",
        semester: "Semester 1",
        description: "",
      });
      setIsAddModalOpen(false);
      alert("Subject added successfully!");
    } catch (err) {
      let errorMessage = "Failed to add subject. Please try again.";
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

  // Edit Subject Functionality
  const handleEditSubject = async () => {
    if (!editingSubject) return;

    // Validate required fields
    if (!newSubject.name.trim()) {
      alert("Please enter subject name");
      return;
    }
    if (!newSubject.code.trim()) {
      alert("Please enter subject code");
      return;
    }
    if (!newSubject.credits || isNaN(parseInt(newSubject.credits))) {
      alert("Please enter valid credits");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Prepare data for API
      const subjectData = {
        name: newSubject.name.trim(),
        code: newSubject.code.trim(),
        department: newSubject.department,
        credits: parseInt(newSubject.credits),
        type: newSubject.type,
        semester: newSubject.semester,
        description: newSubject.description || "",
        status: true,
      };

      await subjectAPI.update(editingSubject._id, subjectData);
      await fetchSubjects();
      setIsEditModalOpen(false);
      setEditingSubject(null);
      alert("Subject updated successfully!");
    } catch (err) {
      let errorMessage = "Failed to update subject. Please try again.";
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

  // Loading state
  if (loading && subjects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subjects...</p>
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
            Subject Management
          </h1>
          <p className="text-lg text-gray-600">
            Manage course subjects and curriculum information
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Search subjects...
              </label>
              <input
                type="text"
                placeholder="Search by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Department
              </label>
              <select
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

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All Types">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All Semesters">All Semesters</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Subject
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && subjects.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{error}</h3>
            <button
              onClick={fetchSubjects}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Subject Grid */}
        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <div
                key={subject._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {subject.code || "No Code"}
                      </h3>
                      <p className="text-blue-100 mt-1">
                        {subject.name || "No Name"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 mb-1">
                        {subject.type || "Unknown"}
                      </span>
                      <span className="block px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        {subject.semester || "Semester 1"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <i className="fas fa-graduation-cap text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Credits:</strong> {subject.credits || 0}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <i className="fas fa-building text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Department:</strong> {subject.department || "No Department"}
                      </span>
                    </div>

                    {subject.description && (
                      <div className="flex items-start">
                        <i className="fas fa-file-alt text-gray-400 w-5 mt-1"></i>
                        <div className="ml-2">
                          <strong className="text-gray-600">Description:</strong>
                          <p className="text-gray-600 text-sm mt-1">
                            {subject.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openEditModal(subject)}
                      className="px-4 py-2 bg-blue-500 text-white-50 rounded-md hover:bg-blue-600"
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
        {!error && filteredSubjects.length === 0 && subjects.length > 0 && (
          <div className="text-center py-12">
            <i className="fas fa-book text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600">
              No subjects found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* No Subjects State */}
        {!error && subjects.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-book text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600">
              No subjects yet
            </h3>
            <p className="text-gray-500">
              Add your first subject using the blue button
            </p>
          </div>
        )}
      </div>

      {/* Add New Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Add New Subject</h2>
              <p className="text-blue-100 mt-1">Enter subject details</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Subject Code *
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={newSubject.code}
                      onChange={handleInputChange}
                      placeholder="e.g., CS101, MA201"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Credits *
                    </label>
                    <input
                      type="number"
                      name="credits"
                      value={newSubject.credits}
                      onChange={handleInputChange}
                      placeholder="e.g., 3, 4"
                      min="0"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newSubject.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Introduction to Programming"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={newSubject.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      Type *
                    </label>
                    <select
                      name="type"
                      value={newSubject.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {types.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Semester *
                    </label>
                    <select
                      name="semester"
                      value={newSubject.semester}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {semesters.map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newSubject.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter subject description..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {isEditModalOpen && editingSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Edit Subject</h2>
              <p className="text-blue-100 mt-1">Update subject information</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Subject Code *
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={newSubject.code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Credits *
                    </label>
                    <input
                      type="number"
                      name="credits"
                      value={newSubject.credits}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newSubject.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={newSubject.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      Type *
                    </label>
                    <select
                      name="type"
                      value={newSubject.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {types.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Semester *
                    </label>
                    <select
                      name="semester"
                      value={newSubject.semester}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {semesters.map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newSubject.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubject}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subject;