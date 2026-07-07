import React, { useState, useEffect, useRef } from "react";
import batchService from "../../services/batchService";
import subjectService from "../../services/subjectService";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const StudentBatches = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedSemester, setSelectedSemester] = useState("All Semesters");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [realSubjects, setRealSubjects] = useState([]);
  const [batchSubjects, setBatchSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const timetableRef = useRef(null);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const timeSlotsList = [
    "09:30-10:30",
    "10:30-11:30",
    "11:30-12:30",
    "12:30-13:30",
    "13:30-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
  ];

  const getNextTimeSlot = (currentSlot) => {
    const index = timeSlotsList.indexOf(currentSlot);
    return timeSlotsList[index + 1];
  };

  const currentYear = new Date().getFullYear();

  const getCurrentAcademicYear = () => {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  };

  const [newBatch, setNewBatch] = useState({
    name: "",
    code: "",
    department: "Computer Science Engineering",
    academicYear: getCurrentAcademicYear(),
    currentSemester: 1,
    startYear: currentYear,
    endYear: currentYear + 4,
    totalStudents: 0,
    status: "Active",
  });

  const departments = [
    "Computer Science Engineering",
    "Information Technology",
    "Computer Technology",
    "Industrial-IOT",
    "Artificial Intelligence",
    "Data Science",
    "Civil Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Robotics",
  ];

  const statusOptions = ["Active", "Graduated", "Inactive"];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const getSemesterText = (semesterNumber) => {
    return `Semester ${semesterNumber}`;
  };

  const getBreakIcon = (breakName) => {
    const name = breakName?.toLowerCase() || "";
    if (name.includes("lunch")) {
      return {
        icon: <i className="fas fa-utensils mr-1"></i>,
        color: "text-orange-600",
        bg: "bg-orange-100",
      };
    } else if (name.includes("tea") || name.includes("coffee")) {
      return {
        icon: <i className="fas fa-mug-hot mr-1"></i>,
        color: "text-amber-600",
        bg: "bg-amber-100",
      };
    } else if (name.includes("sport")) {
      return {
        icon: <i className="fas fa-futbol mr-1"></i>,
        color: "text-green-600",
        bg: "bg-green-100",
      };
    } else if (name.includes("library")) {
      return {
        icon: <i className="fas fa-book mr-1"></i>,
        color: "text-purple-600",
        bg: "bg-purple-100",
      };
    } else {
      return {
        icon: <i className="fas fa-coffee mr-1"></i>,
        color: "text-brown-600",
        bg: "bg-brown-100",
      };
    }
  };

  const getSortedEntriesForDay = (timetable, day) => {
    const classes = (timetable.schedule || [])
      .filter((s) => s && s.day === day)
      .map((c) => ({
        ...c,
        entryType: "class",
        parallelClasses: c.parallelClasses || [],
      }));

    const breaks = (timetable.breaks || [])
      .filter((b) => b && b.day === day)
      .map((b) => ({
        ...b,
        entryType: "break",
        type: "break",
      }));

    return [...classes, ...breaks].sort((a, b) => {
      const getMinutes = (time) => {
        if (!time) return 0;
        const [h, m] = time.split(":").map(Number);
        return h * 60 + (m || 0);
      };
      const aStart = a.timeSlot ? getMinutes(a.timeSlot.split("-")[0]) : 0;
      const bStart = b.timeSlot ? getMinutes(b.timeSlot.split("-")[0]) : 0;
      return aStart - bStart;
    });
  };

  const getDisplayText = (item) => {
    if (!item) return "";
    if (typeof item === "object") {
      return item.subjectCode || item.code || item.name || "";
    }
    return item;
  };

  const downloadTimetableAsPDF = async () => {
    if (!timetableRef.current) {
      alert("No timetable content to download");
      return;
    }

    setDownloading(true);

    try {
      const htmlToImage = await import("html-to-image");
      const jsPDF = (await import("jspdf")).default;

      const element = timetableRef.current;

      const cloneElement = element.cloneNode(true);
      cloneElement.style.padding = "20px";
      cloneElement.style.backgroundColor = "#ffffff";

      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      container.appendChild(cloneElement);
      document.body.appendChild(container);

      try {
        const dataUrl = await htmlToImage.toPng(cloneElement, {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: "#ffffff",
          cacheBust: true,
          style: {
            padding: "20px",
            margin: "0",
            width: "100%",
          },
        });

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
          putOnlyUsedFonts: true,
          compress: true,
        });

        const imgWidth = 280;
        const imgHeight =
          (cloneElement.offsetHeight * imgWidth) / cloneElement.offsetWidth;

        pdf.addImage(dataUrl, "PNG", 5, 5, imgWidth, imgHeight);
        pdf.save(`${selectedTimetable.name.replace(/\s/g, "_")}_Timetable.pdf`);
      } finally {
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error("Error downloading timetable:", error);
      alert("Failed to download timetable. Error: " + error.message);
    } finally {
      setDownloading(false);
    }
  };

  const downloadTimetableAsPNG = async () => {
    if (!timetableRef.current) {
      alert("No timetable content to download");
      return;
    }

    setDownloading(true);

    try {
      const htmlToImage = await import("html-to-image");

      const element = timetableRef.current;

      const cloneElement = element.cloneNode(true);
      cloneElement.style.padding = "20px";
      cloneElement.style.backgroundColor = "#ffffff";

      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      container.appendChild(cloneElement);
      document.body.appendChild(container);

      try {
        const dataUrl = await htmlToImage.toPng(cloneElement, {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: "#ffffff",
          cacheBust: true,
        });

        const link = document.createElement("a");
        link.download = `${selectedTimetable.name.replace(/\s/g, "_")}_Timetable.png`;
        link.href = dataUrl;
        link.click();
      } finally {
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error("Error downloading timetable:", error);
      alert("Failed to download timetable. Error: " + error.message);
    } finally {
      setDownloading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await batchService.getAll();

      let batchesData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          batchesData = response.data.data;
        } else if (Array.isArray(response.data)) {
          batchesData = response.data;
        }
      }

      const allSubjects = await fetchAllSubjects();

      const batchesWithDefaults = batchesData.map((batch) => {
        let subjectCount = 0;
        if (allSubjects.length > 0) {
          subjectCount = allSubjects.filter(
            (subject) =>
              subject.department === batch.department &&
              subject.semester === getSemesterText(batch.currentSemester),
          ).length;
        }

        let formattedAcademicYear = batch.academicYear;
        if (
          batch.academicYear &&
          !batch.academicYear.toString().includes("-")
        ) {
          const year = parseInt(batch.academicYear);
          formattedAcademicYear = `${year}-${year + 1}`;
        }

        return {
          ...batch,
          semesterText: getSemesterText(batch.currentSemester || 1),
          subjectCount: subjectCount,
          academicYear: formattedAcademicYear || getCurrentAcademicYear(),
        };
      });

      setBatches(batchesWithDefaults);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to fetch batches. Please try again.";
      setError(errorMessage);
      console.error("Error fetching batches:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubjects = async () => {
    try {
      const response = await subjectService.getAll();
      const subjects = response.data?.data || [];
      setRealSubjects(subjects);
      return subjects;
    } catch (err) {
      console.error("Error fetching all subjects:", err);
      return [];
    }
  };

  const fetchAndShowTimetable = async (batch) => {
    setLoadingTimetable(true);

    try {

      const response = await api.get(`/timetables?batch=${batch._id}`);
      const data = response.data;

      if (data.success && data.data && data.data.length > 0) {
        const timetableId = data.data[0]._id;
          const timetableResponse = await api.get(`/timetables/${timetableId}`);

         const timetableData = timetableResponse.data;
        if (timetableData.success && timetableData.data) {
          setSelectedTimetable(timetableData.data);
          setShowViewModal(true);
        } else {
          alert("Error loading timetable");
        }
      } else {
        alert("No timetable found for this batch");
      }
    } catch (err) {
      console.error("Error fetching timetable:", err);
      alert("Failed to load timetable");
    } finally {
      setLoadingTimetable(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (user?.role === "user" && user?.department) {
      setSelectedDepartment(user.department);
      if (user?.semester) {
        setSelectedSemester(`Semester ${user.semester}`);
      }
    }
  }, [user]);

  const handleViewSubjects = async (batch) => {
    setSelectedBatch(batch);
    setLoadingSubjects(true);

    try {
      const allSubjects = await fetchAllSubjects();

      if (allSubjects.length > 0 && batch) {
        const filteredSubjects = allSubjects.filter(
          (subject) =>
            subject.department === batch.department &&
            subject.semester === getSemesterText(batch.currentSemester),
        );

        setBatchSubjects(filteredSubjects);
      } else {
        setBatchSubjects([]);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setBatchSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }

    setShowSubjectsModal(true);
  };

  const filteredBatches = (batches || []).filter((batch) => {
    if (!batch || typeof batch !== "object") return false;

    if (user?.role === "user") {

      const userSemesterNumber = user?.semester
        ? parseInt(user.semester)
        : null;

      if (!userSemesterNumber) return false;

      return (
        batch.department === user?.department &&
        batch.currentSemester === userSemesterNumber
      );
    }

    const name = batch.name || "";
    const code = batch.code || "";
    const batchDepartment = batch.department || "";
    const batchSemester = batch.currentSemester || 1;

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batchDepartment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      batchDepartment === selectedDepartment;

    const filterSemesterNumber =
      selectedSemester === "All Semesters"
        ? null
        : parseInt(selectedSemester.replace("Semester ", ""));

    const matchesSemester =
      selectedSemester === "All Semesters" ||
      batchSemester === filterSemesterNumber;

    return matchesSearch && matchesDepartment && matchesSemester;
  });

  const clearFilters = () => {
    setSearchTerm("");
    if (user?.role === "user") {
      setSelectedDepartment(user?.department || "All Departments");
      setSelectedSemester(
        user?.semester ? `Semester ${user.semester}` : "All Semesters",
      );
    } else {
      setSelectedDepartment("All Departments");
      setSelectedSemester("All Semesters");
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!id) {
      alert("Invalid batch ID");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this batch?")) {
      return;
    }

    try {
      const response = await batchService.delete(id);
      await fetchBatches();
      alert("Batch deleted successfully!");
    } catch (err) {
      console.error("Error deleting batch:", err);
      let errorMessage = "Failed to delete batch. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      alert(`Error: ${errorMessage}`);
    }
  };

  const openEditModal = (batch) => {
    if (!batch || !batch._id) {
      alert("Invalid batch data");
      return;
    }

    setEditingBatch(batch);

    let academicYear = batch.academicYear;
    if (academicYear && !academicYear.toString().includes("-")) {
      const year = parseInt(academicYear);
      academicYear = `${year}-${year + 1}`;
    }

    setNewBatch({
      name: batch.name || "",
      code: batch.code || "",
      department: batch.department || "Computer Science Engineering",
      academicYear: academicYear || getCurrentAcademicYear(),
      currentSemester: batch.currentSemester || 1,
      startYear: batch.startYear || currentYear,
      endYear: batch.endYear || currentYear + 4,
      totalStudents: batch.totalStudents || 0,
      status: batch.status || "Active",
    });
    setIsEditModalOpen(true);
    setApiError(null);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingBatch(null);
    setApiError(null);
    setNewBatch({
      name: "",
      code: "",
      department: "Computer Science Engineering",
      academicYear: getCurrentAcademicYear(),
      currentSemester: 1,
      startYear: currentYear,
      endYear: currentYear + 4,
      totalStudents: 0,
      status: "Active",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "academicYear") {
      setNewBatch((prev) => ({
        ...prev,
        academicYear: value,
      }));
    } else if (name === "currentSemester") {
      setNewBatch((prev) => ({
        ...prev,
        [name]: parseInt(value) || 1,
      }));
    } else if (name === "startYear" || name === "endYear") {
      setNewBatch((prev) => ({
        ...prev,
        [name]: parseInt(value) || currentYear,
      }));
    } else {
      setNewBatch((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddBatch = async () => {
    if (!newBatch.name.trim()) {
      alert("Please enter batch name");
      return;
    }
    if (!newBatch.code.trim()) {
      alert("Please enter batch code");
      return;
    }
    if (!newBatch.academicYear || !newBatch.academicYear.includes("-")) {
      alert("Please enter academic year in format YYYY-YYYY (e.g., 2023-2024)");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const batchData = {
        name: newBatch.name.trim(),
        code: newBatch.code.trim(),
        department: newBatch.department,
        academicYear: newBatch.academicYear,
        currentSemester: newBatch.currentSemester,
        startYear: parseInt(newBatch.startYear) || currentYear,
        endYear: parseInt(newBatch.endYear) || currentYear + 4,
        totalStudents: parseInt(newBatch.totalStudents) || 0,
        status: newBatch.status,
      };

      const response = await batchService.create(batchData);
      await fetchBatches();
      closeModals();
      alert("Batch added successfully!");
    } catch (err) {
      console.error("Error adding batch:", err);
      let errorMessage = "Failed to add batch. Please try again.";
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

  const handleEditBatch = async () => {
    if (!editingBatch) return;

    if (!newBatch.name.trim()) {
      alert("Please enter batch name");
      return;
    }
    if (!newBatch.code.trim()) {
      alert("Please enter batch code");
      return;
    }
    if (!newBatch.academicYear || !newBatch.academicYear.includes("-")) {
      alert("Please enter academic year in format YYYY-YYYY (e.g., 2023-2024)");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const batchData = {
        name: newBatch.name.trim(),
        code: newBatch.code.trim(),
        department: newBatch.department,
        academicYear: newBatch.academicYear,
        currentSemester: newBatch.currentSemester,
        startYear: parseInt(newBatch.startYear) || currentYear,
        endYear: parseInt(newBatch.endYear) || currentYear + 4,
        totalStudents: parseInt(newBatch.totalStudents) || 0,
        status: newBatch.status,
      };

      const response = await batchService.update(editingBatch._id, batchData);
      await fetchBatches();
      closeModals();
      alert("Batch updated successfully!");
    } catch (err) {
      console.error("Error updating batch:", err);
      let errorMessage = "Failed to update batch. Please try again.";
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

  const handleCloseSubjects = () => {
    setShowSubjectsModal(false);
    setSelectedBatch(null);
    setBatchSubjects([]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Graduated":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateStats = () => {
    const totalBatches = (batches || []).length;
    const activeBatches = (batches || []).filter(
      (b) => b.status === "Active",
    ).length;
    const totalStudents = (batches || []).reduce(
      (sum, batch) => sum + (batch.totalStudents || 0),
      0,
    );
    return { totalBatches, activeBatches, totalStudents };
  };

  if (loading && (batches || []).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-24 text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-600 mb-2">
            Student Batches Management
          </h1>
          <p className="text-lg text-gray-600">
            Manage departments, batches, and semesters
          </p>
        </div>

        {(batches || []).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <i className="fas fa-users text-blue-600 text-2xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Batches</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calculateStats().totalBatches}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Batches</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calculateStats().activeBatches}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <i className="fas fa-user-graduate text-purple-600 text-2xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calculateStats().totalStudents}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Search batches...
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, code or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Department
              </label>
              {user?.role === "user" ? (
                <input
                  type="text"
                  value={user?.department || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-600"
                />
              ) : (
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
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Semester
              </label>
              {user?.role === "user" ? (
                <input
                  type="text"
                  value={user?.semester ? `Semester ${user.semester}` : ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-600"
                />
              ) : (
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All Semesters">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={`Semester ${sem}`}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
            {user?.role === "admin" && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <i className="fas fa-plus mr-2"></i>
                Add New Batch
              </button>
            )}
          </div>
        </div>

        {error && (batches || []).length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {error}
            </h3>
            <button
              onClick={fetchBatches}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Retry Loading
            </button>
          </div>
        )}

        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <div
                key={batch._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {batch.name}
                      </h3>
                      <p className="text-blue-100 text-sm mt-1">{batch.code}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(batch.status)}`}
                    >
                      {batch.status}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <i className="fas fa-building text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Department:</strong> {batch.department}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-calendar text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Academic Year:</strong> {batch.academicYear}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-layer-group text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Semester:</strong> {batch.semesterText}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-users text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Students:</strong> {batch.totalStudents}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-book text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Subjects:</strong> {batch.subjectCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-graduation-cap text-gray-400 w-5"></i>
                      <span className="ml-2 text-gray-600">
                        <strong>Duration:</strong> {batch.startYear} -{" "}
                        {batch.endYear}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleViewSubjects(batch)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                    >
                      <i className="fas fa-book mr-2"></i>
                      View Subjects
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchAndShowTimetable(batch)}
                        disabled={loadingTimetable}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
                        title="View Timetable"
                      >
                        {loadingTimetable ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-calendar-alt"></i>
                        )}
                      </button>
                      {user?.role === "admin" && (
                        <>
                          <button
                            onClick={() => openEditModal(batch)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(batch._id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!error &&
          filteredBatches.length === 0 &&
          (batches || []).length > 0 && (
            <div className="text-center py-12">
              <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600">
                No batches match your search
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          )}

        {!error && (batches || []).length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-graduation-cap text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600">
              No batches yet
            </h3>
            <p className="text-gray-500">
              Add your first batch using the button below
            </p>
          </div>
        )}
      </div>

      {isAddModalOpen && user?.role === "admin" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Add New Batch</h2>
              <p className="text-blue-100 mt-1">Enter batch details</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newBatch.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Batch Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={newBatch.code}
                    onChange={handleInputChange}
                    placeholder="e.g., CS2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={newBatch.department}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Academic Year * (Format: YYYY-YYYY)
                  </label>
                  <input
                    type="text"
                    name="academicYear"
                    value={newBatch.academicYear}
                    onChange={handleInputChange}
                    placeholder="e.g., 2023-2024"
                    pattern="\d{4}-\d{4}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Current Semester *
                  </label>
                  <select
                    name="currentSemester"
                    value={newBatch.currentSemester}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Start Year *
                  </label>
                  <input
                    type="number"
                    name="startYear"
                    value={newBatch.startYear}
                    onChange={handleInputChange}
                    min="2000"
                    max="2100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    End Year *
                  </label>
                  <input
                    type="number"
                    name="endYear"
                    value={newBatch.endYear}
                    onChange={handleInputChange}
                    min="2000"
                    max="2100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Total Students
                  </label>
                  <input
                    type="number"
                    name="totalStudents"
                    value={newBatch.totalStudents}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newBatch.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
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
                onClick={handleAddBatch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Adding...
                  </>
                ) : (
                  "Add Batch"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingBatch && user?.role === "admin" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Edit Batch</h2>
              <p className="text-blue-100 mt-1">Update batch information</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newBatch.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Batch Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={newBatch.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={newBatch.department}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    name="academicYear"
                    value={newBatch.academicYear}
                    onChange={handleInputChange}
                    placeholder="e.g., 2023-2024"
                    pattern="\d{4}-\d{4}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Current Semester *
                  </label>
                  <select
                    name="currentSemester"
                    value={newBatch.currentSemester}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Start Year *
                  </label>
                  <input
                    type="number"
                    name="startYear"
                    value={newBatch.startYear}
                    onChange={handleInputChange}
                    min="2000"
                    max="2100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    End Year *
                  </label>
                  <input
                    type="number"
                    name="endYear"
                    value={newBatch.endYear}
                    onChange={handleInputChange}
                    min="2000"
                    max="2100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Total Students
                  </label>
                  <input
                    type="number"
                    name="totalStudents"
                    value={newBatch.totalStudents}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newBatch.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
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
                onClick={handleEditBatch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Updating...
                  </>
                ) : (
                  "Update Batch"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubjectsModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedBatch.name} - Subjects
                  </h2>
                  <p className="text-blue-100 mt-1">
                    Department: {selectedBatch.department} | Semester:{" "}
                    {getSemesterText(selectedBatch.currentSemester)} | Total
                    Subjects: {(batchSubjects || []).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loadingSubjects ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading subjects...</p>
                </div>
              ) : (batchSubjects || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(batchSubjects || []).map((subject) => (
                    <div
                      key={subject._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md"
                    >
                      <div className="mb-3">
                        <h4 className="font-bold text-gray-900">
                          {subject.name}
                        </h4>
                        <p className="text-sm text-gray-600">{subject.code}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 w-16">
                            Credits:
                          </span>
                          <span className="font-medium">
                            {subject.credits || 3}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 w-16">
                            Type:
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              (subject.type || "Core") === "Core"
                                ? "bg-green-100 text-green-800"
                                : (subject.type || "Core") === "Elective"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {subject.type || "Core"}
                          </span>
                        </div>
                      </div>

                      {subject.description && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            {subject.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-book text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-600">
                    No subjects found
                  </h3>
                  <p className="text-gray-500">
                    No subjects assigned for {selectedBatch.department} -{" "}
                    {getSemesterText(selectedBatch.currentSemester)}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
              <button
                onClick={handleCloseSubjects}
                className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedTimetable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 p-6 rounded-t-lg sticky top-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedTimetable.name}
                  </h2>
                  <p className="text-white text-sm mt-1">
                    Semester {selectedTimetable.semester}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6" ref={timetableRef}>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 border border-gray-300 font-semibold text-gray-600">
                        Time
                      </th>
                      {daysOfWeek.map((day) => (
                        <th
                          key={day}
                          className="px-4 py-2 border border-gray-300 font-semibold text-gray-600"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlotsList.map((timeSlot) => (
                      <tr key={timeSlot}>
                        <td className="px-4 py-2 border border-gray-300 font-medium bg-gray-50">
                          {timeSlot}
                        </td>
                        {daysOfWeek.map((day) => {
                          const allEntries = getSortedEntriesForDay(
                            selectedTimetable,
                            day,
                          );
                          const entries = allEntries.filter(
                            (e) => e.timeSlot === timeSlot,
                          );
                          const currentEntry = entries[0];

                          const prevSlot =
                            timeSlotsList[timeSlotsList.indexOf(timeSlot) - 1];
                          const prevEntry = allEntries.find(
                            (e) =>
                              e.timeSlot === prevSlot &&
                              e.subject?._id === currentEntry?.subject?._id &&
                              e.day === day,
                          );

                          if (prevEntry) return null;

                          const nextSlot = getNextTimeSlot(timeSlot);
                          const nextEntry = allEntries.find(
                            (e) =>
                              e.timeSlot === nextSlot &&
                              e.subject?._id === currentEntry?.subject?._id &&
                              e.day === day,
                          );

                          const rowSpan = nextEntry ? 2 : 1;

                          return (
                            <td
                              key={`${day}-${timeSlot}`}
                              rowSpan={rowSpan}
                              className="px-4 py-2 border border-gray-300 align-middle text-center"
                            >
                              {entries.length > 0 ? (
                                entries.map((entry, idx) => {
                                  if (
                                    entry.type === "break" ||
                                    entry.entryType === "break"
                                  ) {
                                    const breakIcon = getBreakIcon(entry.name);
                                    return (
                                      <div
                                        key={idx}
                                        className={`p-2 ${breakIcon.bg} rounded mb-1`}
                                      >
                                        <div
                                          className={`font-medium text-sm ${breakIcon.color}`}
                                        >
                                          {breakIcon.icon}{" "}
                                          {entry.name || "Break"}
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div key={idx} className="mb-2">
                                        {entry.subject && (
                                          <div className="p-2 bg-blue-100 rounded mb-1">
                                            <div className="flex justify-between items-center border border-blue-300 rounded px-2 py-1 bg-white">
                                              <span className="font-medium text-sm text-blue-800">
                                                {getDisplayText(entry.subject)}
                                                {entry.type && (
                                                  <span className="ml-1 text-xs text-gray-500">
                                                    ({entry.type})
                                                  </span>
                                                )}
                                                {entry.batchDivision && (
                                                  <span className="ml-1 text-xs">
                                                    -{entry.batchDivision}
                                                  </span>
                                                )}
                                              </span>
                                              {entry.classroom && (
                                                <span className="text-xs font-medium text-gray-600 border-l border-blue-300 pl-2 ml-2">
                                                  {entry.classroom.name}
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                              {getDisplayText(entry.faculty)}
                                            </div>
                                          </div>
                                        )}

                                        {entry.parallelClasses &&
                                          entry.parallelClasses.length > 0 && (
                                            <div className="mt-1">
                                              {entry.parallelClasses.map(
                                                (pc, pIdx) => (
                                                  <div
                                                    key={pIdx}
                                                    className="p-2 bg-purple-100 rounded mt-1"
                                                  >
                                                    <div className="flex justify-between items-center border border-purple-300 rounded px-2 py-1 bg-white">
                                                      <span className="font-medium text-sm text-purple-800">
                                                        {getDisplayText(
                                                          pc.subject,
                                                        )}
                                                        {pc.type && (
                                                          <span className="ml-1 text-xs text-gray-500">
                                                            ({pc.type})
                                                          </span>
                                                        )}
                                                        {pc.batchDivision && (
                                                          <span className="ml-1 text-xs">
                                                            -{pc.batchDivision}
                                                          </span>
                                                        )}
                                                      </span>
                                                      {pc.classroom && (
                                                        <span className="text-xs font-medium text-gray-600 border-l border-purple-300 pl-2 ml-2">
                                                          {pc.classroom.name}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                      {getDisplayText(
                                                        pc.faculty,
                                                      )}
                                                    </div>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    );
                                  }
                                })
                              ) : (
                                <div className="text-gray-300 text-xs text-center">
                                  -
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={downloadTimetableAsPDF}
                disabled={downloading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {downloading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-download"></i>
                )}
                Download PDF
              </button>
              <button
                onClick={downloadTimetableAsPNG}
                disabled={downloading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
              >
                {downloading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-image"></i>
                )}
                Download PNG
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentBatches;