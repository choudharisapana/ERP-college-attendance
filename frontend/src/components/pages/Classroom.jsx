import React, { useState, useEffect } from "react";
import { classroomAPI } from "../../services/api";

const Classroom = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterBuilding, setFilterBuilding] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [newClassroom, setNewClassroom] = useState({
    name: "",
    building: "",
    department: "",
    capacity: "",
    type: "Lecture Hall",
    equipment: [],
    availability: "Available",
  });

  const equipmentOptions = [
    "Projector",
    "Smart Board",
    "Computers",
    "Sound System",
    "Lab Equipment",
    "Whiteboard",
    "Video Conference",
    "Air Conditioning",
    "Network",
  ];

  const buildingOptions = [
    "IT Building",
    "AIDS Building",
    "Mechanical Building",
    "Electrical Building",
    "Admin Building",
    "Chemical Building",
  ];

  const departmentOptions = [
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

  const typeOptions = [
    "Core", "Elective", "Lab", "Project", "Workshop", "Seminar"
  ];
  const availabilityOptions = ["Available", "In Use", "Under Maintenance"];

  // Fetch classrooms from API
  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classroomAPI.getAll();

      // Handle different response structures
      let classroomData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          classroomData = response.data.data;
        } else if (Array.isArray(response.data)) {
          classroomData = response.data;
        }
      }

      setClassrooms(classroomData);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to fetch classrooms. Please try again.";
      setError(errorMessage);
      console.error("Error fetching classrooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  // Filter classrooms based on search, type, building and department
  const filteredClassrooms = classrooms.filter((classroom) => {
    if (!classroom || typeof classroom !== "object") return false;

    const name = classroom.name || "";
    const building = classroom.building || "";
    const department = classroom.department || "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "All" || classroom.type === filterType;

    const matchesBuilding =
      filterBuilding === "All" || classroom.building === filterBuilding;

    const matchesDepartment =
      filterDepartment === "All" || classroom.department === filterDepartment;

    return matchesSearch && matchesType && matchesBuilding && matchesDepartment;
  });

  // Clear filters function
  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("All");
    setFilterBuilding("All");
    setFilterDepartment("All");
  };

  // Add Classroom Functionality
  const handleAddClassroom = async () => {
    // Validate required fields
    if (!newClassroom.name.trim()) {
      alert("Please enter classroom name");
      return;
    }
    if (!newClassroom.building.trim()) {
      alert("Please select a building");
      return;
    }
    if (!newClassroom.department.trim()) {
      alert("Please select a department");
      return;
    }
    if (!newClassroom.capacity || isNaN(parseInt(newClassroom.capacity))) {
      alert("Please enter a valid capacity");
      return;
    }
    if (!newClassroom.type.trim()) {
      alert("Please select a classroom type");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Prepare data for API
      const classroomData = {
        name: newClassroom.name.trim(),
        building: newClassroom.building,
        department: newClassroom.department,
        capacity: parseInt(newClassroom.capacity),
        type: newClassroom.type,
        equipment: newClassroom.equipment,
        availability: newClassroom.availability,
      };

      console.log("Adding classroom with data:", classroomData);

      const response = await classroomAPI.create(classroomData);
      console.log("Classroom added successfully:", response.data);

      // Refresh the list
      await fetchClassrooms();

      // Reset form
      setNewClassroom({
        name: "",
        building: "",
        department: "",
        capacity: "",
        type: "Lecture Hall",
        equipment: [],
        availability: "Available",
      });

      setIsAddModalOpen(false);
      alert("Classroom added successfully!");
    } catch (err) {
      console.error("Error adding classroom:", err);

      // Extract error message
      let errorMessage = "Failed to add classroom. Please try again.";

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

  // Edit Classroom Functionality
  const handleEditClassroom = async () => {
    if (!editingClassroom) return;

    // Validate required fields
    if (!newClassroom.name?.trim()) {
      alert("Please enter classroom name");
      return;
    }
    if (!newClassroom.building?.trim()) {
      alert("Please select a building");
      return;
    }
    if (!newClassroom.department?.trim()) {
      alert("Please select a department");
      return;
    }
    if (!newClassroom.capacity || isNaN(parseInt(newClassroom.capacity))) {
      alert("Please enter a valid capacity");
      return;
    }
    if (!newClassroom.type?.trim()) {
      alert("Please select a classroom type");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Prepare data for API
      const classroomData = {
        name: newClassroom.name.trim(),
        building: newClassroom.building,
        department: newClassroom.department,
        capacity: parseInt(newClassroom.capacity),
        type: newClassroom.type,
        equipment: newClassroom.equipment,
        availability: newClassroom.availability,
      };

      console.log("Updating classroom with data:", classroomData);

      const response = await classroomAPI.update(
        editingClassroom._id,
        classroomData
      );
      console.log("Classroom updated successfully:", response.data);

      // Refresh the list
      await fetchClassrooms();

      setIsEditModalOpen(false);
      setEditingClassroom(null);
      alert("Classroom updated successfully!");
    } catch (err) {
      console.error("Error updating classroom:", err);

      // Extract error message
      let errorMessage = "Failed to update classroom. Please try again.";

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

  // Delete Classroom Functionality
  const handleDeleteClassroom = async (id) => {
    if (!id) {
      alert("Invalid classroom ID");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this classroom?")) {
      return;
    }

    try {
      console.log("Deleting classroom with ID:", id);
      const response = await classroomAPI.delete(id);
      console.log("Classroom deleted successfully:", response.data);

      // Refresh the list
      await fetchClassrooms();
      alert("Classroom deleted successfully!");
    } catch (err) {
      console.error("Error deleting classroom:", err);

      let errorMessage = "Failed to delete classroom. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      alert(`Error: ${errorMessage}`);
    }
  };

  // Open Edit Modal
  const openEditModal = (classroom) => {
    if (!classroom || !classroom._id) {
      alert("Invalid classroom data");
      return;
    }

    setEditingClassroom(classroom);
    setNewClassroom({
      name: classroom.name || "",
      building: classroom.building || "",
      department: classroom.department || "",
      capacity: classroom.capacity ? classroom.capacity.toString() : "",
      type: classroom.type || "Lecture Hall",
      equipment: classroom.equipment || [],
      availability: classroom.availability || "Available",
    });
    setIsEditModalOpen(true);
  };

  // Close Modals
  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingClassroom(null);
    setApiError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClassroom((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setNewClassroom((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle equipment selection
  const toggleEquipment = (equipment) => {
    setNewClassroom((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter((e) => e !== equipment)
        : [...prev.equipment, equipment],
    }));
  };

  // Get availability color class
  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "In Use":
        return "bg-yellow-100 text-yellow-800";
      case "Under Maintenance":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Loading state
  if (loading && classrooms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading classrooms...</p>
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
            Classroom Management
          </h1>
          <p className="text-lg text-gray-600">
            Manage classrooms, labs, and facilities
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
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Search classrooms...
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name, building or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Classroom Type
              </label>
              <select
                id="type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="building"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Building
              </label>
              <select
                id="building"
                value={filterBuilding}
                onChange={(e) => setFilterBuilding(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Buildings</option>
                {buildingOptions.map((building) => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
              </select>
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
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Departments</option>
                {departmentOptions.map((dept) => (
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
              Add Classroom
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && classrooms.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {error}
            </h3>
            <button
              onClick={fetchClassrooms}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Classrooms Grid */}
        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClassrooms.map((classroom) => (
              <div
                key={classroom._id || classroom.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-white">
                      {classroom.name || "No Name"}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getAvailabilityColor(
                        classroom.availability
                      )}`}
                    >
                      {classroom.availability || "Unknown"}
                    </span>
                  </div>
                  <p className="text-blue-100 mt-1">
                    {classroom.building || "No building assigned"}
                  </p>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <i className="fas fa-users text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Capacity:</strong> {classroom.capacity || 0}{" "}
                        students
                      </span>
                    </div>

                    <div className="flex items-center">
                      <i className="fas fa-building text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Type:</strong> {classroom.type || "Unknown"}
                      </span>
                    </div>

                    {classroom.department && (
                      <div className="flex items-center">
                        <i className="fas fa-university text-gray-400 w-5"></i>
                        <span className="ml-2 text-gray-600">
                          <strong>Department:</strong> {classroom.department}
                        </span>
                      </div>
                    )}

                    {classroom.equipment && classroom.equipment.length > 0 && (
                      <div className="flex items-start">
                        <i className="fas fa-tools text-gray-400 w-5 mt-1"></i>
                        <div className="ml-2">
                          <strong className="text-gray-600">Equipment:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(classroom.equipment) ? (
                              classroom.equipment.map((item, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                >
                                  {item}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {classroom.equipment}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openEditModal(classroom)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClassroom(classroom._id)}
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
        {!error && filteredClassrooms.length === 0 && classrooms.length > 0 && (
          <div className="text-center py-12">
            <i className="fas fa-chalkboard-teacher text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600">
              No classrooms found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* No Classrooms State */}
        {!error && classrooms.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-chalkboard-teacher text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600">
              No classrooms yet
            </h3>
            <p className="text-gray-500">
              Add your first subject using the blue button
            </p>
          </div>
        )}
      </div>

      {/* Add New Classroom Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">
                Add New Classroom
              </h2>
              <p className="text-blue-100 mt-1">Enter classroom details</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Classroom Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newClassroom.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Lecture Hall A101"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Building *
                    </label>
                    <select
                      name="building"
                      value={newClassroom.building}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <option value="">Select Building</option>
                      {buildingOptions.map((building) => (
                        <option key={building} value={building}>
                          {building}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={newClassroom.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={newClassroom.capacity}
                      onChange={handleInputChange}
                      placeholder="e.g., 50"
                      min="1"
                      max="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={newClassroom.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <option value="">Select Type</option>
                      {typeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Availability
                  </label>
                  <select
                    name="availability"
                    value={newClassroom.availability}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {availabilityOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Equipment
                  </label>
                  <div className="grid grid-cols-2 gap-2 border border-gray-300 rounded-md p-3 max-h-32 overflow-y-auto">
                    {equipmentOptions.map((item) => (
                      <label key={item} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newClassroom.equipment.includes(item)}
                          onChange={() => toggleEquipment(item)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm text-gray-600">{item}</span>
                      </label>
                    ))}
                  </div>
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
                onClick={handleAddClassroom}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Adding...
                  </>
                ) : (
                  "Add Classroom"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Classroom Modal */}
      {isEditModalOpen && editingClassroom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Edit Classroom</h2>
              <p className="text-blue-100 mt-1">Update classroom information</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Classroom Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newClassroom.name || ""}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Building *
                    </label>
                    <select
                      name="building"
                      value={newClassroom.building || ""}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {buildingOptions.map((building) => (
                        <option key={building} value={building}>
                          {building}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={newClassroom.department || ""}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={newClassroom.capacity || ""}
                      onChange={handleEditInputChange}
                      min="1"
                      max="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={newClassroom.type || ""}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {typeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Availability
                  </label>
                  <select
                    name="availability"
                    value={newClassroom.availability || ""}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {availabilityOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Equipment
                  </label>
                  <div className="grid grid-cols-2 gap-2 border border-gray-300 rounded-md p-3 max-h-32 overflow-y-auto">
                    {equipmentOptions.map((item) => (
                      <label key={item} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newClassroom.equipment.includes(item)}
                          onChange={() => toggleEquipment(item)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm text-gray-600">{item}</span>
                      </label>
                    ))}
                  </div>
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
                onClick={handleEditClassroom}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Updating...
                  </>
                ) : (
                  "Update Classroom"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classroom;