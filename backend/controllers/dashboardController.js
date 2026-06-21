import mongoose from "mongoose";
import Dashboard from "../models/Dashboard.js";
import StudentBatch from "../models/StudentBatch.js";
import Faculty from "../models/Faculty.js";
import Subject from "../models/Subject.js";
import Classroom from "../models/Classroom.js";
import Timetable from "../models/Timetable.js";

export const getDashboardStats = async (req, res) => {
  try {
    // console.log('Fetching dashboard stats...');

    await Dashboard.ensureDashboard();

    const [
      batchStats,
      facultyStats,
      subjectStats,
      classroomStats,
      timetableStats,
      recentActivities,
      chartData,
    ] = await Promise.all([
      getBatchStatistics(),
      getFacultyStatistics(),
      getSubjectStatistics(),
      getClassroomStatistics(),
      getTimetableStatistics(),
      getRecentActivities(),
      getAllChartData(),
    ]);

    // console.log('Timetable Stats:', timetableStats);
    // console.log('Timetable Chart Data:', chartData.timetablesByStatus);

    const dashboard = await Dashboard.findByIdAndUpdate(
      "dashboard",
      {
        stats: {
          ...batchStats,
          ...facultyStats,
          ...subjectStats,
          ...classroomStats,
          ...timetableStats,
        },
        charts: chartData,
        recentActivities: recentActivities.slice(0, 10),
        resourceUtilization: {
          classrooms: await getClassroomUtilization(),
          facultyWorkload: await getFacultyWorkloadDistribution(),
        },
        lastUpdated: new Date(),
      },
      { new: true, upsert: true },
    );

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};

export const getDashboard = async (req, res) => {
  try {
    let dashboard = await Dashboard.findById("dashboard");

    if (
      !dashboard ||
      Date.now() - new Date(dashboard.lastUpdated).getTime() > 5 * 60 * 1000
    ) {
      return getDashboardStats(req, res);
    }

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard",
      error: error.message,
    });
  }
};

export const refreshDashboard = async (req, res) => {
  try {
    await Dashboard.findByIdAndDelete("dashboard");
    return getDashboardStats(req, res);
  } catch (error) {
    console.error("Dashboard refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Error refreshing dashboard",
      error: error.message,
    });
  }
};

const getBatchStatistics = async () => {
  try {
    const batches = await StudentBatch.find();
    const totalBatches = batches.length;
    const activeBatches = batches.filter((b) => b.status === "Active").length;
    const totalStudents = batches.reduce(
      (sum, b) => sum + (b.totalStudents || 0),
      0,
    );

    return { totalBatches, activeBatches, totalStudents };
  } catch (error) {
    console.error("Error in getBatchStatistics:", error);
    return { totalBatches: 0, activeBatches: 0, totalStudents: 0 };
  }
};

const getFacultyStatistics = async () => {
  try {
    const faculties = await Faculty.find();
    const totalFaculty = faculties.length;
    return { totalFaculty };
  } catch (error) {
    console.error("Error in getFacultyStatistics:", error);
    return { totalFaculty: 0 };
  }
};

const getSubjectStatistics = async () => {
  try {
    const subjects = await Subject.find();
    const totalSubjects = subjects.length;
    return { totalSubjects };
  } catch (error) {
    console.error("Error in getSubjectStatistics:", error);
    return { totalSubjects: 0 };
  }
};

const getClassroomStatistics = async () => {
  try {
    const classrooms = await Classroom.find();
    const totalClassrooms = classrooms.length;
    const availableClassrooms = classrooms.filter(
      (c) => c.availability === "Available",
    ).length;
    return { totalClassrooms, availableClassrooms };
  } catch (error) {
    console.error("Error in getClassroomStatistics:", error);
    return { totalClassrooms: 0, availableClassrooms: 0 };
  }
};

const getTimetableStatistics = async () => {
  try {
    const timetables = await Timetable.find();
    const totalTimetables = timetables.length;

    let activeTimetables = 0;
    let draftTimetables = 0;
    let archivedTimetables = 0;

    timetables.forEach((timetable) => {
      const status = timetable.status?.toLowerCase();
      if (status === "active" || status === "published") {
        activeTimetables++;
      } else if (status === "draft") {
        draftTimetables++;
      } else if (status === "archived") {
        archivedTimetables++;
      } else {
        // Agar koi status nahi hai ya kuch aur hai, toh active consider karo
        activeTimetables++;
      }
    });

    // toh saare timetables ko active consider karo
    if (
      totalTimetables > 0 &&
      activeTimetables === 0 &&
      draftTimetables === 0 &&
      archivedTimetables === 0
    ) {
      activeTimetables = totalTimetables;
    }

    return {
      totalTimetables,
      activeTimetables,
      draftTimetables,
      archivedTimetables,
    };
  } catch (error) {
    console.error("Error in getTimetableStatistics:", error);
    return {
      totalTimetables: 0,
      activeTimetables: 0,
      draftTimetables: 0,
      archivedTimetables: 0,
    };
  }
};

const getAllChartData = async () => {
  try {
    const [
      batchesByDepartment,
      facultyByDepartment,
      subjectsByType,
      classroomsByType,
      timetablesByStatus,
      timetableCompletion,
    ] = await Promise.all([
      getBatchesByDepartment(),
      getFacultyByDepartment(),
      getSubjectsByType(),
      getClassroomsByType(),
      getTimetablesByStatus(),
      getTimetableCompletion(),
    ]);

    return {
      batchesByDepartment,
      facultyByDepartment,
      subjectsByType,
      classroomsByType,
      timetablesByStatus,
      timetableCompletion,
    };
  } catch (error) {
    console.error("Error in getAllChartData:", error);
    return {
      batchesByDepartment: [],
      facultyByDepartment: [],
      subjectsByType: [],
      classroomsByType: [],
      timetablesByStatus: [],
      timetableCompletion: [],
    };
  }
};

const getBatchesByDepartment = async () => {
  try {
    const batches = await StudentBatch.find();
    const departments = [
      ...new Set(batches.map((b) => b.department).filter(Boolean)),
    ];

    if (departments.length === 0) {
      return [];
    }
    return departments.map((dept) => ({
      department: dept || "Unknown",
      count: batches.filter((b) => b.department === dept).length,
      students: batches
        .filter((b) => b.department === dept)
        .reduce((sum, b) => sum + (b.totalStudents || 0), 0),
    }));
  } catch (error) {
    console.error("Error in getBatchesByDepartment:", error);
    return [];
  }
};

const getFacultyByDepartment = async () => {
  try {
    const faculties = await Faculty.find();
    const departments = [
      ...new Set(faculties.map((f) => f.department).filter(Boolean)),
    ];

    if (departments.length === 0) {
      return [];
    }

    return departments.map((dept) => {
      const deptFaculties = faculties.filter((f) => f.department === dept);
      return {
        department: dept || "Unknown",
        count: deptFaculties.length,
        avgWorkload:
          deptFaculties.length > 0
            ? Math.round(
                deptFaculties.reduce((sum, f) => sum + (f.workload || 0), 0) /
                  deptFaculties.length,
              )
            : 0,
      };
    });
  } catch (error) {
    console.error("Error in getFacultyByDepartment:", error);
    return [];
  }
};

const getSubjectsByType = async () => {
  try {
    const subjects = await Subject.find();
    const types = [...new Set(subjects.map((s) => s.type).filter(Boolean))];

    if (types.length === 0) {
      return [];
    }

    return types.map((type) => ({
      type: type || "Unknown",
      count: subjects.filter((s) => s.type === type).length,
      totalCredits: subjects
        .filter((s) => s.type === type)
        .reduce((sum, s) => sum + (s.credits || 0), 0),
    }));
  } catch (error) {
    console.error("Error in getSubjectsByType:", error);
    return [];
  }
};

const getClassroomsByType = async () => {
  try {
    const classrooms = await Classroom.find();

    const types = [...new Set(classrooms.map((c) => c.type).filter(Boolean))];

    if (types.length === 0) {
      return [];
    }

    return types.map((type) => ({
      type: type || "Unknown",
      count: classrooms.filter((c) => c.type === type).length,
      totalCapacity: classrooms
        .filter((c) => c.type === type)
        .reduce((sum, c) => sum + (c.capacity || 0), 0),
    }));
  } catch (error) {
    console.error("Error in getClassroomsByType:", error);
    return [];
  }
};

// 🔥 FIXED: Timetable status ko properly map karo
const getTimetablesByStatus = async () => {
  try {
    const timetables = await Timetable.find();

    // console.log('All timetables from DB:', timetables.map(t => ({ id: t._id, name: t.name, status: t.status })));

    // Agar koi timetable nahi hai
    if (timetables.length === 0) {
      console.log("No timetables found");
      return [];
    }

    // Status ke according group karo
    const statusCount = {
      Active: 0,
      Draft: 0,
      Archived: 0,
    };

    timetables.forEach((timetable) => {
      let status = timetable.status;

      // Agar status null/undefined/empty hai toh 'Active' consider karo
      if (!status || status === "") {
        status = "Active";
      }

      // Normalize status
      if (
        status.toLowerCase() === "active" ||
        status.toLowerCase() === "published"
      ) {
        statusCount["Active"]++;
      } else if (status.toLowerCase() === "draft") {
        statusCount["Draft"]++;
      } else if (status.toLowerCase() === "archived") {
        statusCount["Archived"]++;
      } else {
        // Koi aur status hai toh bhi 'Active' mein daalo
        statusCount["Active"]++;
      }
    });

    // Convert to array format
    const result = [
      { status: "Active", count: statusCount["Active"] },
      { status: "Draft", count: statusCount["Draft"] },
      { status: "Archived", count: statusCount["Archived"] },
    ].filter((item) => item.count > 0); // Sirf wahi status dikhao jinka count > 0 hai

    // console.log('Timetables by status result:', result);
    return result;
  } catch (error) {
    console.error("Error in getTimetablesByStatus:", error);
    return [];
  }
};

const getTimetableCompletion = async () => {
  try {
    const timetables = await Timetable.find()
      .populate("batch", "name")
      .limit(5);

    if (timetables.length === 0) {
      return [];
    }

    return timetables.map((t) => ({
      batch: t.batch?.name || "Unknown Batch",
      scheduled: t.schedule?.length || 0,
      total: 30,
      percentage: Math.min(
        100,
        Math.round(((t.schedule?.length || 0) / 30) * 100),
      ),
    }));
  } catch (error) {
    console.error("Error in getTimetableCompletion:", error);
    return [];
  }
};

const getClassroomUtilization = async () => {
  try {
    const classrooms = await Classroom.find();
    const buildings = [
      ...new Set(classrooms.map((c) => c.building).filter(Boolean)),
    ];

    return buildings.map((building) => {
      const buildingClassrooms = classrooms.filter(
        (c) => c.building === building,
      );
      return {
        building,
        total: buildingClassrooms.length,
        inUse: buildingClassrooms.filter((c) => c.availability === "In Use")
          .length,
        available: buildingClassrooms.filter(
          (c) => c.availability === "Available",
        ).length,
        maintenance: buildingClassrooms.filter(
          (c) => c.availability === "Under Maintenance",
        ).length,
      };
    });
  } catch (error) {
    console.error("Error in getClassroomUtilization:", error);
    return [];
  }
};

const getFacultyWorkloadDistribution = async () => {
  try {
    const faculties = await Faculty.find();
    const workloads = faculties.map((f) => f.workload || 0);

    const ranges = [
      { range: "0-5 hours", count: workloads.filter((w) => w <= 5).length },
      {
        range: "6-10 hours",
        count: workloads.filter((w) => w > 5 && w <= 10).length,
      },
      {
        range: "11-15 hours",
        count: workloads.filter((w) => w > 10 && w <= 15).length,
      },
      {
        range: "16-20 hours",
        count: workloads.filter((w) => w > 15 && w <= 20).length,
      },
      { range: "20+ hours", count: workloads.filter((w) => w > 20).length },
    ];

    return ranges;
  } catch (error) {
    console.error("Error in getFacultyWorkloadDistribution:", error);
    return [];
  }
};

const getRecentActivities = async () => {
  try {
    const activities = [];

    const recentBatches = await StudentBatch.find()
      .sort({ createdAt: -1 })
      .limit(3);

    recentBatches.forEach((b) => {
      activities.push({
        type: "batch",
        action: "created",
        itemId: b._id,
        itemName: b.name,
        description: `New batch "${b.name}" created`,
        timestamp: b.createdAt || new Date(),
      });
    });

    const recentFaculty = await Faculty.find().sort({ createdAt: -1 }).limit(3);

    recentFaculty.forEach((f) => {
      activities.push({
        type: "faculty",
        action: "created",
        itemId: f._id,
        itemName: f.name,
        description: `New faculty "${f.name}" added`,
        timestamp: f.createdAt || new Date(),
      });
    });

    const recentTimetables = await Timetable.find()
      .populate("batch", "name")
      .sort({ createdAt: -1 })
      .limit(3);

    recentTimetables.forEach((t) => {
      activities.push({
        type: "timetable",
        action: "created",
        itemId: t._id,
        itemName: t.name,
        description: `New timetable "${t.name}" created for ${t.batch?.name || "batch"}`,
        timestamp: t.createdAt || new Date(),
      });
    });

    const recentSubjects = await Subject.find()
      .sort({ createdAt: -1 })
      .limit(3);

    recentSubjects.forEach((s) => {
      activities.push({
        type: "subject",
        action: "created",
        itemId: s._id,
        itemName: s.name,
        description: `New subject "${s.name}" added`,
        timestamp: s.createdAt || new Date(),
      });
    });

    const recentClassrooms = await Classroom.find()
      .sort({ createdAt: -1 })
      .limit(3);

    recentClassrooms.forEach((c) => {
      activities.push({
        type: "classroom",
        action: "created",
        itemId: c._id,
        itemName: c.name,
        description: `New classroom "${c.name}" added`,
        timestamp: c.createdAt || new Date(),
      });
    });

    return activities.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
  } catch (error) {
    console.error("Error in getRecentActivities:", error);
    return [];
  }
};