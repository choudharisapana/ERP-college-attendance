
// frontend/src/components/pages/Timetable.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { facultyAPI } from "../../services/api";
import Icons from "../../utils/icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Timetable = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === "admin";
  const isFaculty = user?.role === "faculty";

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All Semesters");

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);

  // Data for forms
  const [batches, setBatches] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Time slots data
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

  // New timetable form
  const [newTimetable, setNewTimetable] = useState({
    name: "",
    batch: "",
    semester: "1",
    academicYear: getCurrentAcademicYear(),
    breaks: [],
    totalStudents: 0,
  });

  // Schedule entry form
  const [scheduleEntry, setScheduleEntry] = useState({
    day: "Monday",
    timeSlots: [],
    subject: "",
    faculty: "",
    classroom: "",
    type: "Theory",
    batchDivision: "",
    studentCount: 0,
  });

  // Parallel class entry form
  const [parallelEntry, setParallelEntry] = useState({
    subject: "",
    faculty: "",
    classroom: "",
    type: "Theory",
    batchDivision: "",
    studentCount: 0,
  });

  // Break entry form
  const [breakEntry, setBreakEntry] = useState({
    day: "Monday",
    timeSlots: [],
    name: "Lunch Break",
  });

  // UI state for showing parallel form
  const [showParallelForm, setShowParallelForm] = useState(false);
  const [parallelClasses, setParallelClasses] = useState([]);
  const [showTimeSlotDropdown, setShowTimeSlotDropdown] = useState(false);
  const [showBreakTimeSlotDropdown, setShowBreakTimeSlotDropdown] = useState(false);

  // Filtered data
  const [batchSubjects, setBatchSubjects] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [filteredParallelFaculty, setFilteredParallelFaculty] = useState([]);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);

  // Break suggestions with icons
  const breakSuggestions = [
    { name: "Lunch Break", icon: Icons.FaUtensils, color: "text-orange-600", bg: "bg-orange-100" },
    { name: "Tea Break", icon: Icons.FaMugHot, color: "text-amber-600", bg: "bg-amber-100" },
    { name: "Sports", icon: Icons.FaFutbol, color: "text-green-600", bg: "bg-green-100" },
    { name: "Library", icon: Icons.FaBookReader, color: "text-purple-600", bg: "bg-purple-100" },
    { name: "Gym", icon: Icons.FaDumbbell, color: "text-gray-600", bg: "bg-gray-100" },
    { name: "Music", icon: Icons.FaMusic, color: "text-indigo-600", bg: "bg-indigo-100" },
    { name: "Yoga", icon: Icons.FaYinYang, color: "text-teal-600", bg: "bg-teal-100" },
    { name: "Games", icon: Icons.FaGamepad, color: "text-violet-600", bg: "bg-violet-100" },
    { name: "Snacks", icon: Icons.FaApple, color: "text-red-600", bg: "bg-red-100" },
  ];

  function getCurrentAcademicYear() {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    return `${currentYear}-${nextYear}`;
  }

  const getSemesterText = (semesterNumber) => {
    return `Semester ${semesterNumber}`;
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const getNextTimeSlot = (currentSlot) => {
    const index = timeSlotsList.indexOf(currentSlot);
    return timeSlotsList[index + 1];
  };

  const timeSlotRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const batchDivisionRequiredTypes = ["Lab"];

  const getBreakIcon = (breakName) => {
    const name = breakName?.toLowerCase() || "";
    if (name.includes("lunch")) {
      return { icon: Icons.FaUtensils, color: "text-orange-600", bg: "bg-orange-100" };
    } else if (name.includes("tea") || name.includes("coffee")) {
      return { icon: Icons.FaMugHot, color: "text-amber-600", bg: "bg-amber-100" };
    } else if (name.includes("sport")) {
      return { icon: Icons.FaFutbol, color: "text-green-600", bg: "bg-green-100" };
    } else if (name.includes("library")) {
      return { icon: Icons.FaBookReader, color: "text-purple-600", bg: "bg-purple-100" };
    } else if (name.includes("gym")) {
      return { icon: Icons.FaDumbbell, color: "text-gray-600", bg: "bg-gray-100" };
    } else if (name.includes("music")) {
      return { icon: Icons.FaMusic, color: "text-indigo-600", bg: "bg-indigo-100" };
    } else if (name.includes("yoga")) {
      return { icon: Icons.FaYinYang, color: "text-teal-600", bg: "bg-teal-100" };
    } else if (name.includes("game")) {
      return { icon: Icons.FaGamepad, color: "text-violet-600", bg: "bg-violet-100" };
    } else if (name.includes("snack")) {
      return { icon: Icons.FaApple, color: "text-red-600", bg: "bg-red-100" };
    } else {
      return { icon: Icons.FaCoffee, color: "text-brown-600", bg: "bg-brown-100" };
    }
  };

  // ✅ Fetch all data with api
  const fetchAllData = async () => {
    try {
      setLoading(true);

      const timetablesRes = await api.get('/timetables');
      const timetablesData = timetablesRes.data?.data || timetablesRes.data || [];

      const batchesRes = await api.get('/batches');
      let batchesData = [];
      if (batchesRes.data?.data) {
        batchesData = batchesRes.data.data;
      } else if (Array.isArray(batchesRes.data)) {
        batchesData = batchesRes.data;
      }

      const classroomsRes = await api.get('/classrooms');
      const classroomsData = classroomsRes.data?.data || classroomsRes.data || [];

      let facultiesData = [];
      try {
        const response = await facultyAPI.getAll();
        if (response.data) {
          if (Array.isArray(response.data.data)) {
            facultiesData = response.data.data;
          } else if (Array.isArray(response.data)) {
            facultiesData = response.data;
          }
        }
      } catch (facultyErr) {
        console.error("Error fetching faculty:", facultyErr);
      }

      const subjectsRes = await api.get('/subjects');
      const subjectsData = subjectsRes.data?.data || subjectsRes.data || [];

      const formattedSubjects = subjectsData.map((subject) => ({
        ...subject,
        displayName: subject.subjectCode || subject.code || subject.name,
        fullName: `${subject.subjectCode || subject.code || ""} - ${subject.name || ""}`,
      }));

      setTimetables(timetablesData);
      setBatches(batchesData);
      setClassrooms(classroomsData);
      setFaculties(facultiesData);
      setSubjects(formattedSubjects);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => {
          localStorage.removeItem("auth_token");
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(`Failed to load data: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ Faculty can view, Admin can view
    if (!isAdmin && !isFaculty) {
      navigate('/dashboard');
      return;
    }
    fetchAllData();
  }, [isAdmin, isFaculty]);

  useEffect(() => {
    if (newTimetable.batch) {
      const selectedBatch = batches.find((b) => b._id === newTimetable.batch);
      if (selectedBatch) {
        setSelectedBatchDetails(selectedBatch);

        const currentSemester = selectedBatch.currentSemester || 1;
        let subjectsForBatch = [];

        if (selectedBatch.semesters && Array.isArray(selectedBatch.semesters)) {
          const currentSemesterData = selectedBatch.semesters.find(
            (s) => s.semesterNumber === currentSemester,
          );

          if (currentSemesterData && currentSemesterData.subjects) {
            subjectsForBatch = currentSemesterData.subjects
              .map((s) => s.subject)
              .filter(Boolean);
          }

          if (subjectsForBatch.length === 0) {
            subjectsForBatch = subjects.filter(
              (sub) =>
                sub.department === selectedBatch.department &&
                sub.semester === `Semester ${currentSemester}`,
            );
          }
        } else if (selectedBatch.subjects && Array.isArray(selectedBatch.subjects)) {
          subjectsForBatch = selectedBatch.subjects;
        }

        setBatchSubjects(subjectsForBatch);

        setNewTimetable((prev) => ({
          ...prev,
          totalStudents: selectedBatch.totalStudents || 0,
          semester: currentSemester,
          academicYear: selectedBatch.academicYear || prev.academicYear,
        }));

        setScheduleEntry((prev) => ({
          ...prev,
          subject: "",
          faculty: "",
        }));

        setParallelEntry((prev) => ({
          ...prev,
          subject: "",
          faculty: "",
        }));

        setFilteredFaculty([]);
        setFilteredParallelFaculty([]);
      }
    } else {
      setBatchSubjects([]);
      setSelectedBatchDetails(null);
    }
  }, [newTimetable.batch, batches, subjects]);

  useEffect(() => {
    if (scheduleEntry.subject) {
      const selectedSubject = subjects.find((s) => s._id === scheduleEntry.subject);
      if (!selectedSubject) {
        setFilteredFaculty([]);
        return;
      }

      const subjectCode = selectedSubject.subjectCode || selectedSubject.code || selectedSubject.name;

      const facultyForSubject = faculties.filter(
        (faculty) =>
          Array.isArray(faculty.subjects) &&
          faculty.subjects.some((sub) =>
            subjectCode.toLowerCase().includes(sub.toLowerCase()),
          ),
      );

      setFilteredFaculty(facultyForSubject);
      setScheduleEntry((prev) => ({
        ...prev,
        faculty: "",
      }));
    } else {
      setFilteredFaculty([]);
    }
  }, [scheduleEntry.subject, faculties, subjects]);

  useEffect(() => {
    if (parallelEntry.subject) {
      const selectedSubject = subjects.find((s) => s._id === parallelEntry.subject);
      if (!selectedSubject) {
        setFilteredParallelFaculty([]);
        return;
      }

      const subjectCode = selectedSubject.subjectCode || selectedSubject.code || selectedSubject.name;

      const facultyForSubject = faculties.filter(
        (faculty) =>
          Array.isArray(faculty.subjects) &&
          faculty.subjects.some((sub) =>
            subjectCode.toLowerCase().includes(sub.toLowerCase()),
          ),
      );

      setFilteredParallelFaculty(facultyForSubject);
      setParallelEntry((prev) => ({
        ...prev,
        faculty: "",
      }));
    } else {
      setFilteredParallelFaculty([]);
    }
  }, [parallelEntry.subject, faculties, subjects]);

  useEffect(() => {
    if (!batchDivisionRequiredTypes.includes(scheduleEntry.type)) {
      setScheduleEntry((prev) => ({
        ...prev,
        batchDivision: "",
        studentCount: 0,
      }));
    } else {
      if (scheduleEntry.batchDivision && selectedBatchDetails?.totalStudents) {
        const count = getStudentCountForDivision(
          scheduleEntry.batchDivision,
          selectedBatchDetails.totalStudents,
        );
        setScheduleEntry((prev) => ({
          ...prev,
          studentCount: count,
        }));
      }
    }
  }, [scheduleEntry.type, scheduleEntry.batchDivision, selectedBatchDetails]);

  useEffect(() => {
    if (!batchDivisionRequiredTypes.includes(parallelEntry.type)) {
      setParallelEntry((prev) => ({
        ...prev,
        batchDivision: "",
        studentCount: 0,
      }));
    } else {
      if (parallelEntry.batchDivision && selectedBatchDetails?.totalStudents) {
        const count = getStudentCountForDivision(
          parallelEntry.batchDivision,
          selectedBatchDetails.totalStudents,
        );
        setParallelEntry((prev) => ({
          ...prev,
          studentCount: count,
        }));
      }
    }
  }, [parallelEntry.type, parallelEntry.batchDivision, selectedBatchDetails]);

  const getStudentCountForDivision = (division, totalStudents) => {
    if (!division || !totalStudents) return 0;

    const b1Size = 25;
    const b2Size = 25;
    const b3Size = Math.max(0, totalStudents - 50);

    if (division === "B1") return Math.min(b1Size, totalStudents);
    if (division === "B2") return totalStudents > 25 ? Math.min(b2Size, totalStudents - 25) : 0;
    if (division === "B3") return b3Size;

    return 0;
  };

  const getBatchName = (batch) => {
    if (!batch) return "Not Assigned";
    if (typeof batch === "object") {
      return batch.name || batch.batchName || batch.code || "Not Assigned";
    }
    const found = batches.find((b) => b._id === batch);
    return found ? found.name || found.batchName || found.code : "Not Assigned";
  };

  const getFacultyDisplayName = (faculty) => {
    if (!faculty) return "Unknown Faculty";
    if (typeof faculty === "object") {
      if (faculty.name) return faculty.name;
      if (faculty.user?.name) return faculty.user.name;
    }
    return "Unknown Faculty";
  };

  const getSubjectDisplayName = (subject) => {
    if (!subject) return "Unknown Subject";
    if (typeof subject === "object") {
      return subject.subjectCode || subject.code || subject.name || "Unknown";
    }
    const found = subjects.find((s) => s._id === subject);
    return found ? found.subjectCode || found.code || found.name : "Unknown";
  };

  const getClassroomDisplayName = (classroom) => {
    if (!classroom) return "";
    if (typeof classroom === "object") {
      return classroom.name || "";
    }
    const found = classrooms.find((c) => c._id === classroom);
    return found ? found.name : "";
  };

  const isValidTimeSlot = (timeSlot) => {
    return timeSlotRegex.test(timeSlot);
  };

  const getBatchOptions = (totalStudents) => {
    if (!totalStudents || totalStudents <= 0) return [];

    const options = [];

    options.push({
      value: "B1",
      label: `B1 (25 students)`,
      size: Math.min(25, totalStudents),
    });

    if (totalStudents > 25) {
      options.push({
        value: "B2",
        label: `B2 (25 students)`,
        size: Math.min(25, totalStudents - 25),
      });
    }

    if (totalStudents > 50) {
      options.push({
        value: "B3",
        label: `B3 (${totalStudents - 50} students)`,
        size: totalStudents - 50,
      });
    }

    return options;
  };

  const hasTimeOverlap = (day, timeSlot, excludeId = null) => {
    const [start, end] = timeSlot.split("-").map((t) => {
      const [hours, minutes] = t.split(":").map(Number);
      return hours * 60 + minutes;
    });

    const entries = [
      ...(newTimetable.schedule || []),
      ...(newTimetable.breaks || []),
    ].filter((e) => e.day === day && e._id !== excludeId);

    return entries.some((entry) => {
      const [entryStart, entryEnd] = entry.timeSlot.split("-").map((t) => {
        const [hours, minutes] = t.split(":").map(Number);
        return hours * 60 + minutes;
      });

      return start < entryEnd && end > entryStart;
    });
  };

  const filteredTimetables = timetables.filter((timetable) => {
    if (!timetable) return false;

    const batchInfo = timetable.batch;
    const batchName = getBatchName(batchInfo).toLowerCase();
    const batchDepartment = batchInfo?.department || "";
    const batchSemester = timetable.semester || 1;

    const matchesSearch =
      searchTerm === "" ||
      timetable.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batchName.includes(searchTerm.toLowerCase()) ||
      batchDepartment.toLowerCase().includes(searchTerm.toLowerCase());

    const filterSemesterNumber =
      selectedSemester === "All Semesters"
        ? null
        : parseInt(selectedSemester.replace("Semester ", ""));

    const matchesSemester =
      selectedSemester === "All Semesters" ||
      batchSemester === filterSemesterNumber;

    return matchesSearch && matchesSemester;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSemester("All Semesters");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTimetable({
      ...newTimetable,
      [name]: value,
    });
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setScheduleEntry({
      ...scheduleEntry,
      [name]: value,
    });
  };

  const handleParallelChange = (e) => {
    const { name, value } = e.target;
    setParallelEntry({
      ...parallelEntry,
      [name]: value,
    });
  };

  const handleBreakChange = (e) => {
    const { name, value } = e.target;
    setBreakEntry({
      ...breakEntry,
      [name]: value,
    });
  };

  const addParallelClass = () => {
    if (!parallelEntry.subject || !parallelEntry.faculty || !parallelEntry.classroom) {
      alert("Please fill all fields for parallel class");
      return;
    }

    if (batchDivisionRequiredTypes.includes(parallelEntry.type) && !parallelEntry.batchDivision) {
      alert("Batch division is required for Lab classes");
      return;
    }

    const selectedSubject = subjects.find((s) => s._id === parallelEntry.subject);
    const selectedFaculty = faculties.find((f) => f._id === parallelEntry.faculty);
    const selectedClassroom = classrooms.find((c) => c._id === parallelEntry.classroom);

    if (!selectedSubject || !selectedFaculty || !selectedClassroom) {
      alert("Selected options not found");
      return;
    }

    const newParallelClass = {
      id: Date.now().toString(),
      subject: {
        _id: selectedSubject._id,
        name: selectedSubject.name,
        code: selectedSubject.subjectCode || selectedSubject.code,
      },
      faculty: {
        _id: selectedFaculty._id,
        name: getFacultyDisplayName(selectedFaculty),
      },
      classroom: {
        _id: selectedClassroom._id,
        name: selectedClassroom.name,
        building: selectedClassroom.building,
      },
      type: parallelEntry.type,
      batchDivision: parallelEntry.batchDivision,
      studentCount:
        parallelEntry.batchDivision && selectedBatchDetails?.totalStudents
          ? getStudentCountForDivision(
              parallelEntry.batchDivision,
              selectedBatchDetails.totalStudents,
            )
          : parallelEntry.studentCount,
    };

    setParallelClasses([...parallelClasses, newParallelClass]);
    setParallelEntry({
      subject: "",
      faculty: "",
      classroom: "",
      type: "Theory",
      batchDivision: "",
      studentCount: 0,
    });
  };

  const removeParallelClass = (id) => {
    setParallelClasses(parallelClasses.filter((pc) => pc.id !== id));
  };

  const handleTimeSlotChange = (timeSlot) => {
    setScheduleEntry((prev) => {
      const newTimeSlots = prev.timeSlots.includes(timeSlot)
        ? prev.timeSlots.filter((ts) => ts !== timeSlot)
        : [...prev.timeSlots, timeSlot];
      return { ...prev, timeSlots: newTimeSlots };
    });
  };

  const handleBreakTimeSlotChange = (timeSlot) => {
    setBreakEntry((prev) => {
      const newTimeSlots = prev.timeSlots.includes(timeSlot)
        ? prev.timeSlots.filter((ts) => ts !== timeSlot)
        : [...prev.timeSlots, timeSlot];
      return { ...prev, timeSlots: newTimeSlots };
    });
  };

  const addScheduleEntry = () => {
    if (scheduleEntry.timeSlots.length === 0) {
      alert("Please select at least one time slot");
      return;
    }

    for (const timeSlot of scheduleEntry.timeSlots) {
      if (!isValidTimeSlot(timeSlot)) {
        alert(`Invalid time slot format: ${timeSlot}`);
        return;
      }

      if (hasTimeOverlap(scheduleEntry.day, timeSlot)) {
        alert(
          `Time slot ${timeSlot} overlaps with an existing class or break on ${scheduleEntry.day}`,
        );
        return;
      }
    }

    if (batchDivisionRequiredTypes.includes(scheduleEntry.type) && !scheduleEntry.batchDivision) {
      alert("Batch division is required for Lab classes");
      return;
    }

    const newEntries = scheduleEntry.timeSlots.map((timeSlot, index) => ({
      _id: `main-${Date.now().toString()}-${index}`,
      day: scheduleEntry.day,
      timeSlot: timeSlot,
      subject: scheduleEntry.subject
        ? {
            _id: scheduleEntry.subject,
            name: subjects.find((s) => s._id === scheduleEntry.subject)?.name,
            code:
              subjects.find((s) => s._id === scheduleEntry.subject)
                ?.subjectCode ||
              subjects.find((s) => s._id === scheduleEntry.subject)?.code,
          }
        : null,
      faculty: scheduleEntry.faculty
        ? {
            _id: scheduleEntry.faculty,
            name: getFacultyDisplayName(
              faculties.find((f) => f._id === scheduleEntry.faculty),
            ),
          }
        : null,
      classroom: scheduleEntry.classroom
        ? {
            _id: scheduleEntry.classroom,
            name: classrooms.find((c) => c._id === scheduleEntry.classroom)
              ?.name,
          }
        : null,
      type: scheduleEntry.type,
      batchDivision: scheduleEntry.batchDivision,
      studentCount:
        scheduleEntry.batchDivision && selectedBatchDetails?.totalStudents
          ? getStudentCountForDivision(
              scheduleEntry.batchDivision,
              selectedBatchDetails.totalStudents,
            )
          : scheduleEntry.studentCount,
      parallelClasses: parallelClasses,
    }));

    setNewTimetable({
      ...newTimetable,
      schedule: [...(newTimetable.schedule || []), ...newEntries],
    });

    setScheduleEntry({
      day: "Monday",
      timeSlots: [],
      subject: "",
      faculty: "",
      classroom: "",
      type: "Theory",
      batchDivision: "",
      studentCount: 0,
    });
    setParallelClasses([]);
    setShowParallelForm(false);
    setShowTimeSlotDropdown(false);
  };

  const addBreakEntry = () => {
    if (breakEntry.timeSlots.length === 0) {
      alert("Please select at least one time slot for the break");
      return;
    }

    if (!breakEntry.name) {
      alert("Please enter a break name");
      return;
    }

    for (const timeSlot of breakEntry.timeSlots) {
      if (!isValidTimeSlot(timeSlot)) {
        alert(`Invalid time slot format: ${timeSlot}`);
        return;
      }

      if (hasTimeOverlap(breakEntry.day, timeSlot)) {
        alert(
          `Time slot ${timeSlot} overlaps with an existing class or break on ${breakEntry.day}`,
        );
        return;
      }
    }

    const newBreaks = breakEntry.timeSlots.map((timeSlot, index) => ({
      _id: `break-${Date.now().toString()}-${index}`,
      day: breakEntry.day,
      timeSlot: timeSlot,
      name: breakEntry.name,
      type: "break",
    }));

    setNewTimetable((prev) => ({
      ...prev,
      breaks: [...(prev.breaks || []), ...newBreaks],
    }));

    setBreakEntry({
      day: "Monday",
      timeSlots: [],
      name: "Lunch Break",
    });

    setShowBreakTimeSlotDropdown(false);
    alert("Break(s) added successfully!");
  };

  const removeScheduleEntry = (id) => {
    setNewTimetable({
      ...newTimetable,
      schedule: (newTimetable.schedule || []).filter(
        (entry) => entry._id !== id,
      ),
    });
  };

  const removeBreakEntry = (id) => {
    setNewTimetable({
      ...newTimetable,
      breaks: (newTimetable.breaks || []).filter((entry) => entry._id !== id),
    });
  };

  // ✅ Edit Timetable - Only Admin
  const editTimetable = async (timetable) => {
    if (!isAdmin) {
      alert("You don't have permission to edit timetables");
      return;
    }

    try {
      const response = await api.get(`/timetables/${timetable._id}`);
      const fullTimetable = response.data?.data || response.data;

      const formattedSchedule = (fullTimetable.schedule || []).map((entry) => ({
        _id: entry._id || `main-${Date.now()}-${Math.random()}`,
        day: entry.day,
        timeSlot: entry.timeSlot,
        subject: entry.subject
          ? {
              _id: entry.subject._id,
              name: entry.subject.name,
              code: entry.subject.code,
            }
          : null,
        faculty: entry.faculty
          ? {
              _id: entry.faculty._id,
              name: entry.faculty.name,
            }
          : null,
        classroom: entry.classroom
          ? {
              _id: entry.classroom._id,
              name: entry.classroom.name,
            }
          : null,
        type: entry.type,
        batchDivision: entry.batchDivision,
        studentCount: entry.studentCount,
        parallelClasses: (entry.parallelClasses || []).map((pc) => ({
          id: pc._id || `pc-${Date.now()}-${Math.random()}`,
          subject: {
            _id: pc.subject?._id,
            name: pc.subject?.name,
            code: pc.subject?.code,
          },
          faculty: {
            _id: pc.faculty?._id,
            name: pc.faculty?.name,
          },
          classroom: {
            _id: pc.classroom?._id,
            name: pc.classroom?.name,
          },
          type: pc.type,
          batchDivision: pc.batchDivision,
          studentCount: pc.studentCount,
        })),
      }));

      setNewTimetable({
        _id: fullTimetable._id,
        name: fullTimetable.name,
        batch: fullTimetable.batch?._id || fullTimetable.batch,
        semester: fullTimetable.semester?.toString() || "1",
        academicYear: fullTimetable.academicYear || getCurrentAcademicYear(),
        schedule: formattedSchedule,
        breaks: (fullTimetable.breaks || []).map((b) => ({
          _id: b._id || `break-${Date.now()}-${Math.random()}`,
          day: b.day,
          timeSlot: b.timeSlot,
          name: b.name,
          type: "break",
        })),
        totalStudents: fullTimetable.totalStudents || 0,
      });

      setShowCreateModal(true);
    } catch (err) {
      console.error("Error fetching timetable for editing:", err);
      alert("Failed to load timetable for editing");
    }
  };

  // ✅ Create/Update Timetable - Only Admin
  const createTimetable = async () => {
    if (!isAdmin) {
      alert("You don't have permission to create timetables");
      return;
    }

    if (!newTimetable.name || !newTimetable.batch) {
      alert("Please fill all required fields");
      return;
    }

    if ((newTimetable.schedule || []).length === 0) {
      alert("Please add at least one class to the schedule");
      return;
    }

    try {
      const scheduleData = (newTimetable.schedule || []).map((entry) => ({
        day: entry.day,
        timeSlot: entry.timeSlot,
        subject: entry.subject?._id,
        faculty: entry.faculty?._id,
        classroom: entry.classroom?._id,
        type: entry.type,
        batchDivision:
          entry.type === "Lab" && entry.batchDivision
            ? entry.batchDivision
            : undefined,
        studentCount: entry.studentCount,
        parallelClasses: (entry.parallelClasses || []).map((pc) => ({
          subject: pc.subject._id,
          faculty: pc.faculty._id,
          classroom: pc.classroom._id,
          type: pc.type,
          batchDivision:
            pc.type === "Lab" && pc.batchDivision
              ? pc.batchDivision
              : undefined,
          studentCount: pc.studentCount,
        })),
      }));

      const breakData = (newTimetable.breaks || []).map((breakItem) => ({
        day: breakItem.day,
        timeSlot: breakItem.timeSlot,
        name: breakItem.name,
        type: "break",
      }));

      const selectedBatch = batches.find((b) => b._id === newTimetable.batch);

      const timetableData = {
        name: newTimetable.name,
        batch: newTimetable.batch,
        semester: parseInt(newTimetable.semester),
        academicYear: newTimetable.academicYear,
        schedule: scheduleData,
        breaks: breakData,
        totalStudents: selectedBatch?.totalStudents || 0,
      };

      let response;
      if (newTimetable._id) {
        response = await api.put(`/timetables/${newTimetable._id}`, timetableData);
        alert("Timetable updated successfully!");
      } else {
        response = await api.post('/timetables', timetableData);
        alert("Timetable created successfully!");
      }

      setShowCreateModal(false);

      setNewTimetable({
        name: "",
        batch: "",
        semester: "1",
        academicYear: getCurrentAcademicYear(),
        schedule: [],
        breaks: [],
        totalStudents: 0,
      });

      await fetchAllData();
    } catch (err) {
      console.error("Error saving timetable:", err);
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
      } else {
        alert(err.response?.data?.message || "Failed to save timetable");
      }
    }
  };

  // ✅ View Timetable
  const viewTimetable = async (timetable) => {
    try {
      const response = await api.get(`/timetables/${timetable._id}`);
      const fullTimetable = response.data?.data || response.data;
      setSelectedTimetable(fullTimetable);
      setShowViewModal(true);
    } catch (err) {
      console.error("Error fetching timetable details:", err);
      alert("Failed to load timetable details");
    }
  };

  // ✅ Delete Timetable - Only Admin
  const deleteTimetable = async (id) => {
    if (!isAdmin) {
      alert("You don't have permission to delete timetables");
      return;
    }

    if (window.confirm("Are you sure you want to delete this timetable?")) {
      try {
        await api.delete(`/timetables/${id}`);
        alert("Timetable deleted successfully!");
        fetchAllData();
      } catch (err) {
        console.error("Error deleting timetable:", err);
        alert("Failed to delete timetable");
      }
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

  const filteredClassrooms =
    scheduleEntry.type === "Lab"
      ? classrooms.filter((c) => c.type === "Lab")
      : classrooms.filter((c) => c.type !== "Lab");

  const filteredParallelClassrooms =
    parallelEntry.type === "Lab"
      ? classrooms.filter((c) => c.type === "Lab")
      : classrooms.filter((c) => c.type !== "Lab");

  const selectedBatch = batches.find((b) => b._id === newTimetable.batch);
  const batchOptions = selectedBatch
    ? getBatchOptions(selectedBatch.totalStudents || 0)
    : [];
  const requiresBatchDivision = batchDivisionRequiredTypes.includes(
    scheduleEntry.type,
  );
  const parallelRequiresBatchDivision = batchDivisionRequiredTypes.includes(
    parallelEntry.type,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timetables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              {error.includes('expired') ? 'Session Expired' : 'Error Loading Data'}
            </h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={fetchAllData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
              {error.includes('expired') && (
                <button
                  onClick={() => {
                    localStorage.removeItem("auth_token");
                    window.location.href = "/login";
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Go to Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pt-24 text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-600 mb-2">
            Timetable Management
          </h1>
          <p className="text-lg text-gray-600">
            {isAdmin ? "Create and manage class schedules" : "View class schedules"}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Search and Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Semester
              </label>
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
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
            <div className="flex items-center space-x-3">
              {/* ✅ New Timetable Button - Only Admin */}
              {isAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <i className="fas fa-plus mr-2"></i>
                  New Timetable
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Timetables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTimetables.map((timetable) => {
            const batchInfo =
              typeof timetable.batch === "object"
                ? timetable.batch
                : batches.find((b) => b._id === timetable.batch);
            const batchName = getBatchName(batchInfo);
            const batchDepartment = batchInfo?.department || "N/A";
            const batchSemester =
              batchInfo?.currentSemester || timetable.semester || 1;
            const batchAcademicYear =
              batchInfo?.academicYear || timetable.academicYear || "N/A";
            const totalStudents =
              batchInfo?.totalStudents || timetable.totalStudents || 0;

            let subjectCount = 0;

            if (batchInfo?.semesters?.length > 0) {
              const semData = batchInfo.semesters.find(
                (s) => s.semesterNumber === batchSemester,
              );
              if (semData?.subjects?.length > 0) {
                subjectCount = semData.subjects.filter((s) => s.subject).length;
              }
            }

            if (subjectCount === 0 && batchSubjects?.length > 0) {
              subjectCount = batchSubjects.length;
            }

            return (
              <div
                key={timetable._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div
                  className={`bg-gradient-to-r ${
                    timetable.status === "Published"
                      ? "from-green-500 to-green-600"
                      : "from-blue-500 to-blue-600"
                  } p-4`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {timetable.name}
                      </h3>
                      <p className="text-white text-sm mt-1 opacity-90">
                        {batchName} • Semester {batchSemester}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-calendar text-gray-400"></i>
                      <span className="text-sm text-gray-600">
                        Academic Year
                      </span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {batchAcademicYear}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-users text-gray-400"></i>
                      <span className="text-sm text-gray-600">Student</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {totalStudents}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-building text-gray-400"></i>
                      <span className="text-sm text-gray-600">Department</span>
                    </div>
                    <span className="font-bold text-gray-800">
                      {batchDepartment}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-between gap-2">
                  {/* ✅ View - Everyone */}
                  <button
                    onClick={() => viewTimetable(timetable)}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                  >
                    <i className="fa-solid fa-eye mr-2"></i>
                    View
                  </button>

                  {/* ✅ Edit - Only Admin */}
                  {isAdmin && (
                    <button
                      onClick={() => editTimetable(timetable)}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit
                    </button>
                  )}

                  {/* ✅ Delete - Only Admin */}
                  {isAdmin && (
                    <button
                      onClick={() => deleteTimetable(timetable._id)}
                      className="flex-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Delete
                    </button>
                  )}

                  {/* ✅ Faculty - View Only Label */}
                  {isFaculty && !isAdmin && (
                    <div className="flex-1 text-center text-sm text-gray-500 py-2">
                    
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty States */}
        {filteredTimetables.length === 0 && timetables.length > 0 && (
          <div className="text-center py-12">
            <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600">
              No timetables match your search
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {timetables.length === 0 && !error && (
          <div className="text-center py-12">
            <i className="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600">
              No timetables yet
            </h3>
            <p className="text-gray-500">
              {isAdmin ? "Create your first timetable using the button above" : "No timetables available"}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Timetable Modal - Only Admin */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          {/* ... (rest of modal code remains same) ... */}
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 p-6">
              <h2 className="text-2xl font-bold text-white">
                {newTimetable._id ? "Edit Timetable" : "Create New Timetable"}
              </h2>
            </div>

            <div className="p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Timetable Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newTimetable.name}
                    onChange={handleInputChange}
                    placeholder="e.g., CSE Section (A) Semester 1"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Select Batch *
                  </label>
                  <select
                    name="batch"
                    value={newTimetable.batch}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Batch</option>
                    {batches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.batchName || batch.name} - Semester{" "}
                        {batch.currentSemester || 1} ({batch.totalStudents || 0}{" "}
                        students)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch Info Section */}
              {selectedBatchDetails && (
                <div className="mb-6 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-600 mb-2">
                    Batch Information
                  </h4>
                  <p className="text-sm text-blue-600">
                    <span className="font-semibold">Academic Year:</span>{" "}
                    {selectedBatchDetails.academicYear ||
                      getCurrentAcademicYear()}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    <span className="font-semibold">Semester:</span>{" "}
                    {selectedBatchDetails.currentSemester || 1} |
                    <span className="font-semibold ml-1">Department:</span>{" "}
                    {selectedBatchDetails.department}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    <span className="font-semibold">Subjects:</span>{" "}
                    {batchSubjects.length}
                  </p>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p className="text-sm font-semibold text-blue-700">
                      Batch Distribution:
                    </p>
                    <p className="text-sm text-blue-600">
                      B1: 25 students | B2: 25 students | B3:{" "}
                      {Math.max(
                        0,
                        (selectedBatchDetails.totalStudents || 0) - 50,
                      )}{" "}
                      students
                    </p>
                  </div>
                </div>
              )}

              {/* Add Class Form */}
              <div className="border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Add Class Schedule
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Day
                    </label>
                    <select
                      name="day"
                      value={scheduleEntry.day}
                      onChange={handleScheduleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {daysOfWeek.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Time Slots *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowTimeSlotDropdown(!showTimeSlotDropdown)
                      }
                      className="w-full px-3 py-2 border rounded-md text-left bg-white flex justify-between items-center"
                    >
                      <span>
                        {scheduleEntry.timeSlots.length === 0
                          ? "Time slots"
                          : `${scheduleEntry.timeSlots.length} Time slot selected`}
                      </span>
                      <i className="fas fa-chevron-down"></i>
                    </button>
                    {showTimeSlotDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {timeSlotsList.map((timeSlot) => (
                          <label
                            key={timeSlot}
                            className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={scheduleEntry.timeSlots.includes(
                                timeSlot,
                              )}
                              onChange={() => handleTimeSlotChange(timeSlot)}
                              className="mr-2"
                            />
                            <span>{timeSlot}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Subject
                    </label>
                    <select
                      name="subject"
                      value={scheduleEntry.subject}
                      onChange={handleScheduleChange}
                      className="w-full px-3 py-2 border rounded-md"
                      disabled={
                        !newTimetable.batch || batchSubjects.length === 0
                      }
                    >
                      <option value="">
                        {!newTimetable.batch
                          ? "Select batch first"
                          : batchSubjects.length === 0
                            ? "No subjects in current semester"
                            : "Select Subject"}
                      </option>
                      {batchSubjects.map((item) => {
                        const subject = item?.subject || item;
                        if (!subject) return null;

                        const subjectCode =
                          subject.subjectCode ||
                          subject.code ||
                          subject.name ||
                          "Unknown";
                        const subjectName = subject.name || "";

                        return (
                          <option key={subject._id} value={subject._id}>
                            {subjectCode} {subjectName && `- ${subjectName}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Faculty
                    </label>
                    <select
                      name="faculty"
                      value={scheduleEntry.faculty}
                      onChange={handleScheduleChange}
                      className="w-full px-3 py-2 border rounded-md"
                      disabled={!scheduleEntry.subject}
                    >
                      <option value="">
                        {!scheduleEntry.subject
                          ? "Select subject first"
                          : "Select Faculty"}
                      </option>
                      {filteredFaculty.map((faculty) => (
                        <option key={faculty._id} value={faculty._id}>
                          {getFacultyDisplayName(faculty)} -{" "}
                          {faculty.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Type
                    </label>
                    <select
                      name="type"
                      value={scheduleEntry.type}
                      onChange={handleScheduleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="Theory">Select Theory</option>
                      <option value="Core">Core</option>
                      <option value="Lab">Lab</option>
                      <option value="MDM">MDM</option>
                      <option value="PEC">PEC</option>
                      <option value="Elective">Elective</option>
                      <option value="Project">Project</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Classroom
                    </label>
                    <select
                      name="classroom"
                      value={scheduleEntry.classroom}
                      onChange={handleScheduleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select Classroom</option>
                      {filteredClassrooms.map((classroom) => (
                        <option key={classroom._id} value={classroom._id}>
                          {classroom.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {requiresBatchDivision && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch Division <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="batchDivision"
                        value={scheduleEntry.batchDivision}
                        onChange={handleScheduleChange}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Batch Division</option>
                        {selectedBatchDetails?.totalStudents > 0 && (
                          <>
                            <option value="B1">B1 (25 students)</option>
                            {selectedBatchDetails.totalStudents > 25 && (
                              <option value="B2">B2 (25 students)</option>
                            )}
                            {selectedBatchDetails.totalStudents > 50 && (
                              <option value="B3">
                                B3 ({selectedBatchDetails.totalStudents - 50}{" "}
                                students)
                              </option>
                            )}
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </div>

                {/* Parallel Classes Section */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowParallelForm(!showParallelForm)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showParallelForm
                      ? "− Hide Parallel Classes"
                      : "+ Add Parallel Classes"}
                  </button>

                  {showParallelForm && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-3">Add Parallel Class</h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <select
                            name="subject"
                            value={parallelEntry.subject}
                            onChange={handleParallelChange}
                            className="w-full px-3 py-2 border rounded-md"
                            disabled={
                              !newTimetable.batch || batchSubjects.length === 0
                            }
                          >
                            <option value="">
                              {!newTimetable.batch
                                ? "Select batch first"
                                : batchSubjects.length === 0
                                  ? "No subjects in current semester"
                                  : "Select Subject"}
                            </option>
                            {batchSubjects.map((item) => {
                              const subject = item?.subject || item;
                              if (!subject) return null;

                              const subjectCode =
                                subject.subjectCode ||
                                subject.code ||
                                subject.name ||
                                "Unknown";
                              const subjectName = subject.name || "";

                              return (
                                <option key={subject._id} value={subject._id}>
                                  {subjectCode}{" "}
                                  {subjectName && `- ${subjectName}`}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <select
                            name="faculty"
                            value={parallelEntry.faculty}
                            onChange={handleParallelChange}
                            className="w-full px-3 py-2 border rounded-md"
                            disabled={!parallelEntry.subject}
                          >
                            <option value="">
                              {!parallelEntry.subject
                                ? "Select subject first"
                                : "Select Faculty"}
                            </option>
                            {filteredParallelFaculty.map((faculty) => (
                              <option key={faculty._id} value={faculty._id}>
                                {getFacultyDisplayName(faculty)} -{" "}
                                {faculty.department}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <select
                            name="type"
                            value={parallelEntry.type}
                            onChange={handleParallelChange}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="Theory">Select Theory</option>
                            <option value="Core">Core</option>
                            <option value="Lab">Lab</option>
                            <option value="MDM">MDM</option>
                            <option value="PEC">PEC</option>
                            <option value="Elective">Elective</option>
                            <option value="Project">Project</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Seminar">Seminar</option>
                          </select>
                        </div>

                        <div>
                          <select
                            name="classroom"
                            value={parallelEntry.classroom}
                            onChange={handleParallelChange}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="">Select Classroom</option>
                            {filteredParallelClassrooms.map((classroom) => (
                              <option key={classroom._id} value={classroom._id}>
                                {classroom.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {parallelRequiresBatchDivision && (
                          <div>
                            <select
                              name="batchDivision"
                              value={parallelEntry.batchDivision}
                              onChange={handleParallelChange}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="">Select Batch Division</option>
                              {selectedBatchDetails?.totalStudents > 0 && (
                                <>
                                  <option value="B1">B1 (25 students)</option>
                                  {selectedBatchDetails.totalStudents > 25 && (
                                    <option value="B2">B2 (25 students)</option>
                                  )}
                                  {selectedBatchDetails.totalStudents > 50 && (
                                    <option value="B3">
                                      B3 (
                                      {selectedBatchDetails.totalStudents - 50}{" "}
                                      students)
                                    </option>
                                  )}
                                </>
                              )}
                            </select>
                          </div>
                        )}

                        <div>
                          <button
                            onClick={addParallelClass}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {parallelClasses.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">
                            Added Parallel Classes:
                          </h5>
                          <div className="space-y-2">
                            {parallelClasses.map((pc) => (
                              <div
                                key={pc.id}
                                className="flex items-center justify-between p-2 bg-white rounded border"
                              >
                                <span className="text-sm">
                                  {pc.subject.code}{" "}
                                  {pc.batchDivision && `(${pc.batchDivision})`}{" "}
                                  - {pc.faculty.name} - {pc.classroom.name}
                                </span>
                                <button
                                  onClick={() => removeParallelClass(pc.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={addScheduleEntry}
                  disabled={
                    scheduleEntry.timeSlots.length === 0 ||
                    (requiresBatchDivision && !scheduleEntry.batchDivision)
                  }
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 w-full"
                >
                  Add to Schedule ({scheduleEntry.timeSlots.length} time
                  slot(s)){" "}
                  {parallelClasses.length > 0 &&
                    `(+${parallelClasses.length} parallel classes)`}
                </button>
              </div>

              {/* Add Break Form */}
              <div className="border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Add Break</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Day
                    </label>
                    <select
                      name="day"
                      value={breakEntry.day}
                      onChange={handleBreakChange}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {daysOfWeek.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Time Slots *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowBreakTimeSlotDropdown(!showBreakTimeSlotDropdown)
                      }
                      className="w-full px-3 py-2 border rounded-md text-left bg-white flex justify-between items-center"
                    >
                      <span>
                        {breakEntry.timeSlots.length === 0
                          ? "Time slots"
                          : `${breakEntry.timeSlots.length} Time slot selected`}
                      </span>
                      <i className="fas fa-chevron-down"></i>
                    </button>
                    {showBreakTimeSlotDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {timeSlotsList.map((timeSlot) => (
                          <label
                            key={timeSlot}
                            className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={breakEntry.timeSlots.includes(timeSlot)}
                              onChange={() =>
                                handleBreakTimeSlotChange(timeSlot)
                              }
                              className="mr-2"
                            />
                            <span>{timeSlot}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Break Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={breakEntry.name}
                        onChange={handleBreakChange}
                        placeholder="e.g., Lunch Break, Sports, Library"
                        className="w-full px-3 py-2 border rounded-md pl-10"
                      />
                      {breakEntry.name && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          {(() => {
                            const breakIcon = getBreakIcon(breakEntry.name);
                            const IconComponent = breakIcon.icon;
                            return (
                              <IconComponent className={breakIcon.color} />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={addBreakEntry}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    Add Break
                  </button>
                </div>
              </div>

              {/* Schedule Preview */}
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Current Schedule ({newTimetable.schedule?.length || 0}{" "}
                  classes, {newTimetable.breaks?.length || 0} breaks)
                </h3>

                {newTimetable.schedule?.length > 0 ||
                newTimetable.breaks?.length > 0 ? (
                  <div className="space-y-3">
                    {newTimetable.schedule?.map((entry) => (
                      <div
                        key={entry._id}
                        className="flex items-center justify-between p-3 rounded"
                      >
                        <div className="flex-1">
                          <span className="font-medium">
                            {entry.day} {entry.timeSlot}
                          </span>
                          {entry.subject && (
                            <div className="flex justify-between items-center border border-gray-300 rounded px-3 py-1 mt-1 bg-white max-w-xs">
                              <span className="text-sm font-medium">
                                {entry.subject.code}
                                {entry.type && (
                                  <span className="ml-1 text-xs text-gray-600">
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
                                <span className="text-xs font-medium text-gray-6 border-l border-gray-300 pl-2 ml-2">
                                  {entry.classroom.name}
                                </span>
                              )}
                            </div>
                          )}
                          {entry.parallelClasses?.length > 0 && (
                            <span className="ml-2 text-xs text-purple-600">
                              +{entry.parallelClasses.length} parallel
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeScheduleEntry(entry._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}

                    {newTimetable.breaks?.map((breakItem) => {
                      const breakIcon = getBreakIcon(breakItem.name);
                      const IconComponent = breakIcon.icon;

                      return (
                        <div
                          key={breakItem._id}
                          className="flex items-center justify-between p-3 rounded"
                        >
                          <div className="flex items-center flex-1">
                            <div
                              className={`p-2 rounded-full ${breakIcon.bg} mr-3`}
                            >
                              <IconComponent className={breakIcon.color} />
                            </div>
                            <div>
                              <span className="font-medium">
                                {breakItem.day} {breakItem.timeSlot}
                              </span>
                              <span className="ml-3 text-sm">
                                {breakItem.name}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeBreakEntry(breakItem._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    No classes or breaks scheduled yet
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTimetable({
                    name: "",
                    batch: "",
                    semester: "1",
                    academicYear: getCurrentAcademicYear(),
                    schedule: [],
                    breaks: [],
                    totalStudents: 0,
                  });
                }}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={createTimetable}
                disabled={!newTimetable.schedule?.length}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {newTimetable._id ? "Update Timetable" : "Create Timetable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Timetable Modal */}
      {showViewModal && selectedTimetable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 p-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedTimetable.name}
              </h2>
              <p className="text-white text-sm mt-1">
                Semester {selectedTimetable.semester}
              </p>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border table-fixed">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 border">Time</th>
                      {daysOfWeek.map((day) => (
                        <th key={day} className="px-4 py-2 border">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const sortedTimeSlots = timeSlotsList;
                      return timeSlotsList.map((timeSlot) => (
                        <tr key={timeSlot}>
                          <td className="px-4 py-2 border font-medium bg-gray-50">
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
                              timeSlotsList[
                                timeSlotsList.indexOf(timeSlot) - 1
                              ];

                            const prevEntry = allEntries.find(
                              (e) =>
                                e.timeSlot === prevSlot &&
                                e.subject?._id === currentEntry?.subject?._id &&
                                e.day === day,
                            );

                            const nextSlot = getNextTimeSlot(timeSlot);

                            const nextEntry = allEntries.find(
                              (e) =>
                                e.timeSlot === nextSlot &&
                                e.subject?._id === currentEntry?.subject?._id &&
                                e.day === day,
                            );

                            return (
                              <td
                                key={`${day}-${timeSlot}`}
                                className="border align-middle text-center h-[90px] min-w-[120px] p-0"
                              >
                                {entries.length > 0 ? (
                                  entries.map((entry, idx) => {
                                    if (
                                      entry.type === "break" ||
                                      entry.entryType === "break"
                                    ) {
                                      const breakIcon = getBreakIcon(
                                        entry.name,
                                      );
                                      const IconComponent = breakIcon.icon;

                                      return (
                                        <div
                                          key={idx}
                                          className={`mx-1 my-1 p-2 rounded flex items-center justify-center ${breakIcon.bg}`}
                                        >
                                          <div
                                            className={`font-medium text-sm ${breakIcon.color}`}
                                          >
                                            <IconComponent className="inline mr-1" />
                                            {entry.name || "Break"}
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div
                                          key={idx}
                                          className="h-full flex flex-col justify-center"
                                        >
                                          {entry.subject && (
                                            <div className="p-2 bg-blue-100 rounded mb-1 mt-1 mx-1 ">
                                              <div className="flex justify-between items-center border border-blue-300 rounded px-2 py-1 bg-white">
                                                <span className="font-medium text-sm text-blue-800">
                                                  {getDisplayText(
                                                    entry.subject,
                                                  )}
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
                                              <div className="text-xs text-gray-600 mt-1 mx-1">
                                                {getDisplayText(entry.faculty)}
                                              </div>
                                            </div>
                                          )}

                                          {entry.parallelClasses &&
                                            entry.parallelClasses.length >
                                              0 && (
                                              <div className="mt-1 mx-1">
                                                {entry.parallelClasses.map(
                                                  (pc, pIdx) => (
                                                    <div
                                                      key={pIdx}
                                                      className="p-2 bg-purple-100 rounded mb-2 mt-1 mx-1"
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
                                                              -
                                                              {pc.batchDivision}
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
                                  <div className="h-full flex items-center justify-center text-gray-300 text-xs">
                                    -
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
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

export default Timetable;