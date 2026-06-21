import mongoose from "mongoose";
import Timetable from "../models/Timetable.js";
import StudentBatch from "../models/StudentBatch.js";
import Subject from "../models/Subject.js";
import Faculty from "../models/Faculty.js";
import Classroom from "../models/Classroom.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendBulkEmail } from "../services/emailService.js";

// Generate timetable automatically
export const generateTimetable = async (req, res) => {
  try {
    const { batchId, semester } = req.body;

    if (!batchId || !semester) {
      return res.status(400).json({
        success: false,
        message: "Batch ID and semester are required",
      });
    }

    const batch = await Batch.findById(batchId).populate(
      "semesters.subjects.subject",
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Get subjects for this batch department and semester
    const semesterData = batch.semesters.find(
      (s) => s.semesterNumber === Number(semester),
    );

    if (!semesterData || semesterData.subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subjects assigned to this batch semester",
      });
    }

    const subjects = semesterData.subjects.map((s) => s.subject);

    // Get available faculties
    const faculties = await Faculty.find({
      department: batch.department,
      status: "Active",
    });

    if (faculties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active faculties found for this department",
      });
    }

    // Get available classrooms
    const classrooms = await Classroom.find({
      availability: "Available",
    });

    if (classrooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No available classrooms found",
      });
    }

    // Days and time slots
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timeSlots = [
      "09:00-10:30",
      "10:45-12:15",
      "13:30-15:00",
      "15:15-16:45",
    ];

    // Generate schedule
    const schedule = [];
    const assignedSlots = new Set();

    // Assign classes
    subjects.forEach((subject) => {
      const subjectHours = subject.credits || 3;
      const isLab = subject.type === "Lab";
      const availableTimeSlots = isLab
        ? ["13:30-15:00", "15:15-16:45"]
        : timeSlots;
      const classroomType = isLab ? "Lab" : "Lecture Hall";

      for (let hour = 0; hour < subjectHours; hour++) {
        let assigned = false;

        for (const day of days) {
          if (assigned) break;

          for (const timeSlot of availableTimeSlots) {
            if (assigned) break;

            // Check if slot is available
            const slotKey = `${day}-${timeSlot}`;
            if (assignedSlots.has(slotKey)) continue;

            // Find suitable faculty
            const suitableFaculties = faculties.filter((f) => {
              if (!f.subjects || f.subjects.length === 0) return true;
              return f.subjects.includes(subject._id);
            });

            for (const faculty of suitableFaculties) {
              if (assigned) break;

              // Find suitable classroom
              const suitableClassrooms = classrooms.filter(
                (c) =>
                  c.type === classroomType &&
                  c.capacity >= (batch.totalStudents || 60),
              );

              for (const classroom of suitableClassrooms) {
                if (assigned) break;

                // Check for conflicts
                const facultyConflict = schedule.some(
                  (s) =>
                    s.faculty &&
                    s.faculty.toString() === faculty._id.toString() &&
                    s.day === day &&
                    s.timeSlot === timeSlot,
                );

                const classroomConflict = schedule.some(
                  (s) =>
                    s.classroom &&
                    s.classroom.toString() === classroom._id.toString() &&
                    s.day === day &&
                    s.timeSlot === timeSlot,
                );

                if (!facultyConflict && !classroomConflict) {
                  schedule.push({
                    day,
                    timeSlot,
                    subject: subject._id,
                    faculty: faculty._id,
                    classroom: classroom._id,
                    type: isLab ? "Lab" : "Theory",
                    parallelClasses: [],
                  });

                  assignedSlots.add(slotKey);
                  assigned = true;
                  break;
                }
              }
            }
          }
        }
      }
    });

    // Populate references for response
    const populatedSchedule = await Promise.all(
      schedule.map(async (entry) => {
        const [subject, faculty, classroom] = await Promise.all([
          Subject.findById(entry.subject).select("name code credits type"),
          Faculty.findById(entry.faculty).populate("user", "name"),
          Classroom.findById(entry.classroom).select(
            "name building capacity type",
          ),
        ]);

        return {
          ...entry,
          subject: {
            _id: entry.subject,
            name: subject?.name,
            code: subject?.code,
          },
          faculty: {
            _id: entry.faculty,
            name: faculty?.user?.name || faculty?.name,
          },
          classroom: {
            _id: entry.classroom,
            name: classroom?.name,
            building: classroom?.building,
          },
          parallelClasses: [],
        };
      }),
    );

    res.status(200).json({
      success: true,
      message: "Timetable generated successfully",
      data: {
        schedule: populatedSchedule,
        summary: {
          totalClasses: schedule.length,
          theoryClasses: schedule.filter((s) => s.type === "Theory").length,
          labClasses: schedule.filter((s) => s.type === "Lab").length,
          assignedFaculties: new Set(
            schedule.map((s) => s.faculty?.toString()).filter(Boolean),
          ).size,
          usedClassrooms: new Set(
            schedule.map((s) => s.classroom?.toString()).filter(Boolean),
          ).size,
        },
      },
    });
  } catch (error) {
    console.error("Error generating timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error generating timetable",
      error: error.message,
    });
  }
};

// Create new timetable
export const createTimetable = async (req, res) => {
  try {
    const {
      name,
      batch,
      semester,
      academicYear,
      startDate,
      endDate,
      schedule,
      breaks,
      totalStudents,
    } = req.body;

    // Validate required fields
    if (!name || !batch || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Name, batch, semester, and academic year are required",
      });
    }

    // Check if timetable already exists
    const existingTimetable = await Timetable.findOne({
      batch,
      semester,
      academicYear,
      status: { $ne: "Archived" },
    });

    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        message:
          "A timetable already exists for this batch, semester, and academic year",
      });
    }

    // Get batch to get total students if not provided
    let batchTotalStudents = totalStudents;
    let batchData = null;
    if (!batchTotalStudents) {
      batchData = await StudentBatch.findById(batch);
      batchTotalStudents = batchData?.totalStudents || 0;
    }

    // Create timetable
    const timetable = new Timetable({
      name,
      batch: new mongoose.Types.ObjectId(batch),
      semester,
      academicYear,
      startDate,
      endDate,
      schedule: schedule || [],
      breaks: breaks || [],
      totalStudents: batchTotalStudents,
      createdBy: req.user?._id,
    });
    await timetable.save();

    // Populate references
    const populatedTimetable = await Timetable.findById(timetable._id)
      .populate({
        path: "batch",
        populate: {
          path: "semesters.subjects.subject",
        },
      })
      .populate("schedule.subject", "name code credits type")
      .populate("schedule.faculty", "name email")
      .populate("schedule.classroom", "name building capacity type")
      .populate("schedule.parallelClasses.subject", "name code")
      .populate("schedule.parallelClasses.faculty", "name")
      .populate("schedule.parallelClasses.classroom", "name building");

    // Add notification for timetable creation
    try {
      if (!batchData) {
        batchData = await StudentBatch.findById(batch);
      }

      const batchName = batchData?.name || batchData?.code || "Batch";
      const notificationMessage = `Time Table Created: ${name} for ${batchName} - Semester ${semester} (${academicYear})`;

      // Use Map to avoid duplicate recipients
      const recipientsMap = new Map();

      // Helper function to add recipient
      const addRecipient = (id) => {
        if (!id) return;
        recipientsMap.set(id.toString(), { user: id, read: false });
      };

      // Add Admins
      const adminUsers = await mongoose
        .model("User")
        .find({ role: "admin" })
        .select("_id");

      adminUsers.forEach((admin) => addRecipient(admin._id));

      // Add Coordinator
      if (batchData?.coordinator) {
        addRecipient(batchData.coordinator);
      }

      // Add Faculties from schedule
      if (schedule && schedule.length > 0) {
        const facultyIds = schedule
          .map((entry) => entry.faculty)
          .filter(Boolean);

        facultyIds.forEach((facultyId) => addRecipient(facultyId));
      }

      // Convert Map to array for recipients
      const recipients = Array.from(recipientsMap.values());

      // Only create notification if there are recipients
      if (recipients.length > 0) {
        const notification = new Notification({
          title: "Timetable Created",
          message: notificationMessage,
          type: "Schedule Change",
          priority: "High",
          recipients: recipients,
          sender: req.user?._id,
          relatedEntity: {
            type: "Timetable",
            id: timetable._id,
          },
          actionUrl: `/timetable/${timetable._id}`,
          isActive: true,
        });

        await notification.save();
        console.log("Notification created for timetable creation");
      }

      // Send email only if admin
      if (req.user && req.user.role === "admin") {
        const users = await User.find({ role: "user", isActive: true }).select(
          "email",
        );

        const emails = users.map((u) => u.email);

        if (emails.length > 0) {
          await sendBulkEmail(
            emails,
            "New Timetable Created",
            `New timetable "${name}" has been created for Semester ${semester}. Please check dashboard.`,
          );

          console.log(`✅ Email sent to ${emails.length} users`);
        }
      }

      if (emails.length > 0) {
        await sendBulkEmail(
          emails,
          "New Timetable Created",
          `New timetable "${name}" has been created for Semester ${semester}. Please check dashboard.`,
        );
        console.log(`Email sent to ${emails.length} users`);
      }
    } catch (notificationError) {
      console.error(
        "Error creating notification or sending emails:",
        notificationError,
      );
    }

    res.status(201).json({
      success: true,
      message: "Timetable created successfully",
      data: populatedTimetable,
    });
  } catch (error) {
    console.error("Error creating timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error creating timetable",
      error: error.message,
    });
  }
};

// Get all timetables
export const getAllTimetables = async (req, res) => {
  try {
    const { batch, semester, academicYear, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    if (batch) query.batch = batch;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    // Pagination
    const skip = (page - 1) * limit;

    const timetables = await Timetable.find(query)
      .populate({
        path: "batch",
        select:
          "name code department totalStudents currentSemester academicYear semesters",
        populate: {
          path: "semesters.subjects.subject",
          select: "name code",
        },
      })
      .populate("schedule.subject", "name code")
      .populate("schedule.faculty", "name")
      .populate("schedule.classroom", "name building")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Timetable.countDocuments(query);

    res.status(200).json({
      success: true,
      count: timetables.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: timetables,
    });
  } catch (error) {
    console.error("Error fetching timetables:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching timetables",
      error: error.message,
    });
  }
};

// Get timetable by ID
export const getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate({
        path: "batch",
        populate: {
          path: "semesters.subjects.subject",
        },
      })
      .populate(
        "schedule.subject",
        "name code credits type department semester",
      )
      .populate("schedule.faculty")
      .populate(
        "schedule.classroom",
        "name building capacity type equipment availability",
      )
      .populate("schedule.parallelClasses.subject", "name code")
      .populate("schedule.parallelClasses.faculty", "name")
      .populate("schedule.parallelClasses.classroom", "name building");

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    res.status(200).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching timetable",
      error: error.message,
    });
  }
};

// Update timetable
export const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if timetable exists and get original data for comparison
    const originalTimetable = await Timetable.findById(id).populate(
      "batch",
      "name code",
    );

    if (!originalTimetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    // Store original data for change tracking
    const originalName = originalTimetable.name;
    const originalSchedule = originalTimetable.schedule;

    // Update timetable
    const updatedTimetable = await Timetable.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: "batch",
        populate: {
          path: "semesters.subjects.subject",
        },
      })
      .populate("schedule.subject", "name code credits type")
      .populate("schedule.faculty", "name email")
      .populate("schedule.classroom", "name building capacity type")
      .populate("schedule.parallelClasses.subject", "name code")
      .populate("schedule.parallelClasses.faculty", "name")
      .populate("schedule.parallelClasses.classroom", "name building");

    // Add notification for timetable update
    try {
      const batchName =
        updatedTimetable.batch?.name || updatedTimetable.batch?.code || "Batch";

      let changeDetails = "";
      if (originalName !== updateData.name) {
        changeDetails += ` Name changed from "${originalName}" to "${updateData.name}".`;
      }

      const scheduleChanged = updateData.schedule
        ? JSON.stringify(originalSchedule) !==
          JSON.stringify(updateData.schedule)
        : false;

      if (scheduleChanged) {
        changeDetails += " Schedule has been modified.";
      }

      const notificationMessage = `Time Table Updated: ${updatedTimetable.name} for ${batchName} - Semester ${updatedTimetable.semester} (${updatedTimetable.academicYear}).${changeDetails}`;

      // Use Map to avoid duplicate recipients
      const recipientsMap = new Map();

      // Helper function to add recipient
      const addRecipient = (id) => {
        if (!id) return;
        recipientsMap.set(id.toString(), { user: id, read: false });
      };

      // Add Admins
      const adminUsers = await mongoose
        .model("User")
        .find({ role: "admin" })
        .select("_id");

      adminUsers.forEach((admin) => addRecipient(admin._id));

      // Add Coordinator
      const batchData = await StudentBatch.findById(updatedTimetable.batch._id);

      if (batchData?.coordinator) {
        addRecipient(batchData.coordinator);
      }

      // Add Faculties from updated schedule
      if (updateData.schedule && updateData.schedule.length > 0) {
        const facultyIds = updateData.schedule
          .map((entry) => entry.faculty)
          .filter(Boolean);

        facultyIds.forEach((facultyId) => addRecipient(facultyId));
      }

      // Convert Map to array for recipients
      const recipients = Array.from(recipientsMap.values());

      // Only create notification if there are recipients
      if (recipients.length > 0) {
        const notification = new Notification({
          title: scheduleChanged
            ? "Timetable Updated (Schedule Changed)"
            : "Timetable Updated",
          message: notificationMessage,
          type: "Schedule Change",
          priority: "High",
          recipients: recipients,
          sender: req.user?._id,
          relatedEntity: {
            type: "Timetable",
            id: updatedTimetable._id,
          },
          actionUrl: `/timetable/${updatedTimetable._id}`,
          isActive: true,
        });

        await notification.save();
      }

      // Send email to all users
      const users = await User.find({ role: "user", isActive: true }).select(
        "email",
      );
      const emails = users.map((u) => u.email);

      if (emails.length > 0) {
        await sendBulkEmail(
          emails,
          "Timetable Updated",
          `Timetable "${updatedTimetable.name}" has been updated. Please check latest schedule.`,
        );
        console.log(`Update email sent to ${emails.length} users`);
      }
    } catch (notificationError) {
      console.error(
        "Error creating notification for update:",
        notificationError,
      );
    }

    res.status(200).json({
      success: true,
      message: "Timetable updated successfully",
      data: updatedTimetable,
    });
  } catch (error) {
    console.error("Error updating timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error updating timetable",
      error: error.message,
    });
  }
};

// Delete timetable
export const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id).populate(
      "batch",
      "name code",
    );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    // Store timetable info before deletion for notification
    const timetableInfo = {
      name: timetable.name,
      batch: timetable.batch,
      semester: timetable.semester,
      academicYear: timetable.academicYear,
      id: timetable._id,
    };

    await Timetable.findByIdAndDelete(req.params.id);

    // Add notification for timetable deletion
    try {
      const batchName =
        timetableInfo.batch?.name || timetableInfo.batch?.code || "Batch";

      const notificationMessage = `Time Table Deleted: ${timetableInfo.name} for ${batchName} - Semester ${timetableInfo.semester} (${timetableInfo.academicYear}) has been removed.`;

      // Use Map to avoid duplicate recipients
      const recipientsMap = new Map();

      // Helper function to add recipient
      const addRecipient = (id) => {
        if (!id) return;
        recipientsMap.set(id.toString(), { user: id, read: false });
      };

      // Add Admins
      const adminUsers = await mongoose
        .model("User")
        .find({ role: "admin" })
        .select("_id");

      adminUsers.forEach((admin) => addRecipient(admin._id));

      // Add Coordinator
      const batchData = await StudentBatch.findById(timetableInfo.batch._id);

      if (batchData?.coordinator) {
        addRecipient(batchData.coordinator);
      }

      // Convert Map to array for recipients
      const recipients = Array.from(recipientsMap.values());

      // Only create notification if there are recipients
      if (recipients.length > 0) {
        const notification = new Notification({
          title: "Timetable Deleted",
          message: notificationMessage,
          type: "Schedule Change",
          priority: "High",
          recipients: recipients,
          sender: req.user?._id,
          relatedEntity: {
            type: "Timetable",
            id: timetableInfo.id,
          },
          isActive: true,
        });

        await notification.save();
        console.log("Notification created for timetable deletion");
      }

      // 🟢 Send email to all users
      const users = await User.find({ role: "user", isActive: true }).select(
        "email",
      );
      const emails = users.map((u) => u.email);

      if (emails.length > 0) {
        await sendBulkEmail(
          emails,
          "Timetable Deleted",
          `Timetable "${timetableInfo.name}" has been removed.`,
        );
        console.log(`Deletion email sent to ${emails.length} users`);
      }
    } catch (notificationError) {
      console.error("Error creating deletion notification:", notificationError);
    }

    res.status(200).json({
      success: true,
      message: "Timetable deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting timetable",
      error: error.message,
    });
  }
};

// Check conflicts
export const checkConflicts = async (req, res) => {
  try {
    const { day, timeSlot, faculty, classroom, excludeTimetableId } = req.body;

    const query = {
      status: { $ne: "Archived" },
      "schedule.day": day,
      "schedule.timeSlot": timeSlot,
      $or: [],
    };

    if (faculty) {
      query.$or.push({ "schedule.faculty": faculty });
      query.$or.push({ "schedule.parallelClasses.faculty": faculty });
    }

    if (classroom) {
      query.$or.push({ "schedule.classroom": classroom });
      query.$or.push({ "schedule.parallelClasses.classroom": classroom });
    }

    if (excludeTimetableId) {
      query._id = { $ne: excludeTimetableId };
    }

    const conflicts = await Timetable.find(query)
      .populate("batch", "name code")
      .populate("schedule.faculty", "name")
      .populate("schedule.classroom", "name building");

    res.status(200).json({
      success: true,
      data: conflicts,
    });
  } catch (error) {
    console.error("Error checking conflicts:", error);
    res.status(500).json({
      success: false,
      message: "Error checking conflicts",
      error: error.message,
    });
  }
};

// Publish timetable
export const publishTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id).populate(
      "batch",
      "name code",
    );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    if (timetable.status === "Published") {
      return res.status(400).json({
        success: false,
        message: "Timetable is already published",
      });
    }

    timetable.status = "Published";
    await timetable.save();

    // Add notification for timetable publication
    try {
      const batchName =
        timetable.batch?.name || timetable.batch?.code || "Batch";

      const notificationMessage = `Time Table Published: ${timetable.name} for ${batchName} - Semester ${timetable.semester} (${timetable.academicYear}) is now available for viewing.`;

      // Use Map to avoid duplicate recipients
      const recipientsMap = new Map();

      // Helper function to add recipient
      const addRecipient = (id) => {
        if (!id) return;
        recipientsMap.set(id.toString(), { user: id, read: false });
      };

      // Add Admins
      const adminUsers = await mongoose
        .model("User")
        .find({ role: "admin" })
        .select("_id");

      adminUsers.forEach((admin) => addRecipient(admin._id));

      // Add Coordinator
      const batchData = await StudentBatch.findById(timetable.batch._id);

      if (batchData?.coordinator) {
        addRecipient(batchData.coordinator);
      }

      // Add Faculties from timetable schedule
      if (timetable.schedule && timetable.schedule.length > 0) {
        const facultyIds = timetable.schedule
          .map((entry) => entry.faculty)
          .filter(Boolean);

        facultyIds.forEach((facultyId) => addRecipient(facultyId));
      }

      // Convert Map to array for recipients
      const recipients = Array.from(recipientsMap.values());

      // Only create notification if there are recipients
      if (recipients.length > 0) {
        const notification = new Notification({
          title: "Timetable Published",
          message: notificationMessage,
          type: "Schedule Change",
          priority: "High",
          recipients: recipients,
          sender: req.user?._id,
          relatedEntity: {
            type: "Timetable",
            id: timetable._id,
          },
          actionUrl: `/timetable/${timetable._id}`,
          isActive: true,
        });

        await notification.save();
        console.log("Notification created for timetable publication");
      }

      // 🟢 Send email to all users on publication
      const users = await User.find({ role: "user", isActive: true }).select(
        "email",
      );
      const emails = users.map((u) => u.email);

      if (emails.length > 0) {
        await sendBulkEmail(
          emails,
          "Timetable Published",
          `Timetable "${timetable.name}" for Semester ${timetable.semester} has been published and is now available for viewing.`,
        );
        console.log(`Publication email sent to ${emails.length} users`);
      }
    } catch (notificationError) {
      console.error(
        "Error creating publication notification:",
        notificationError,
      );
    }

    res.status(200).json({
      success: true,
      message: "Timetable published successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error publishing timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error publishing timetable",
      error: error.message,
    });
  }
};

// Add break to timetable
export const addBreak = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, timeSlot, name } = req.body;

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    timetable.breaks.push({ day, timeSlot, name, type: "break" });
    await timetable.save();

    res.status(200).json({
      success: true,
      message: "Break added successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error adding break:", error);
    res.status(500).json({
      success: false,
      message: "Error adding break",
      error: error.message,
    });
  }
};

// Remove break from timetable
export const removeBreak = async (req, res) => {
  try {
    const { id, breakId } = req.params;

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    timetable.breaks = timetable.breaks.filter(
      (b) => b._id.toString() !== breakId,
    );
    await timetable.save();

    res.status(200).json({
      success: true,
      message: "Break removed successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error removing break:", error);
    res.status(500).json({
      success: false,
      message: "Error removing break",
      error: error.message,
    });
  }
};