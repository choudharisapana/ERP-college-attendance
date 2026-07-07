import mongoose from "mongoose";
import Timetable from "../models/Timetable.js";
import StudentBatch from "../models/StudentBatch.js";
import Subject from "../models/Subject.js";
import Faculty from "../models/Faculty.js";
import Classroom from "../models/Classroom.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendBulkEmail } from "../services/emailService.js";

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

    if (!name || !batch || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Name, batch, semester, and academic year are required",
      });
    }

    const existingTimetable = await Timetable.findOne({
      batch,
      semester,
      academicYear,
      status: { $ne: "Archived" },
    });

    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        message: "A timetable already exists for this batch, semester, and academic year",
      });
    }

    const conflictErrors = await checkConflictsForSchedule(schedule || []);
    if (conflictErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Conflict(s) detected",
        conflicts: conflictErrors,
      });
    }

    let batchTotalStudents = totalStudents;
    let batchData = null;
    if (!batchTotalStudents) {
      batchData = await StudentBatch.findById(batch);
      batchTotalStudents = batchData?.totalStudents || 0;
    }

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
      status: "Draft",
    });
    await timetable.save();

    const populatedTimetable = await populateTimetable(timetable._id);

    await createTimetableNotification(timetable, batchData, req.user);

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

export const getAllTimetables = async (req, res) => {
  try {
    const { batch, semester, academicYear, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (batch) query.batch = batch;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const timetables = await Timetable.find(query)
      .populate({
        path: "batch",
        select: "name code department totalStudents currentSemester academicYear semesters",
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

export const getTimetableById = async (req, res) => {
  try {
    const timetable = await populateTimetable(req.params.id);

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

export const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const originalTimetable = await Timetable.findById(id).populate("batch", "name code");
    if (!originalTimetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    const conflictErrors = await checkConflictsForSchedule(updateData.schedule || [], id);
    if (conflictErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Conflict(s) detected",
        conflicts: conflictErrors,
      });
    }

    const originalName = originalTimetable.name;
    const originalSchedule = originalTimetable.schedule;

    const updatedTimetable = await Timetable.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    const populatedTimetable = await populateTimetable(id);

    await createUpdateNotification(
      populatedTimetable,
      originalName,
      originalSchedule,
      updateData,
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Timetable updated successfully",
      data: populatedTimetable,
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

export const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id).populate("batch", "name code");

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    const timetableInfo = {
      name: timetable.name,
      batch: timetable.batch,
      semester: timetable.semester,
      academicYear: timetable.academicYear,
      id: timetable._id,
    };

    await Timetable.findByIdAndDelete(req.params.id);

    await createDeletionNotification(timetableInfo, req.user);

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


export const publishTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id).populate("batch", "name code");

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

    await createPublicationNotification(timetable, req.user);

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

export const checkConflicts = async (req, res) => {
  try {
    const { day, timeSlot, faculty, classroom, excludeTimetableId } = req.body;

    const query = {
      status: { $ne: "Archived" },
      "schedule.day": day,
      "schedule.timeSlot": timeSlot,
    };

    const conditions = [];
    if (faculty) {
      conditions.push({ "schedule.faculty": faculty });
      conditions.push({ "schedule.parallelClasses.faculty": faculty });
    }
    if (classroom) {
      conditions.push({ "schedule.classroom": classroom });
      conditions.push({ "schedule.parallelClasses.classroom": classroom });
    }

    if (conditions.length > 0) {
      query.$or = conditions;
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
      count: conflicts.length,
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

export const generateTimetable = async (req, res) => {
  try {
    const { batchId, semester } = req.body;

    if (!batchId || !semester) {
      return res.status(400).json({
        success: false,
        message: "Batch ID and semester are required",
      });
    }

    const batch = await StudentBatch.findById(batchId).populate(
      "semesters.subjects.subject",
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const semesterData = batch.semesters?.find(
      (s) => s.semesterNumber === Number(semester),
    );

    if (!semesterData || semesterData.subjects?.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subjects assigned to this batch semester",
      });
    }

    const subjects = semesterData.subjects.map((s) => s.subject).filter(Boolean);

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

    const classrooms = await Classroom.find({
      availability: "Available",
    });

    if (classrooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No available classrooms found",
      });
    }

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timeSlots = [
      "09:30-10:30",
      "10:30-11:30",
      "11:30-12:30",
      "12:30-13:30",
      "13:30-14:00",
      "14:00-15:00",
      "15:00-16:00",
      "16:00-17:00",
    ];

    const schedule = [];
    const assignedSlots = new Set();

    for (const subject of subjects) {
      const subjectHours = subject.credits || 3;
      const isLab = subject.type === "Lab";
      const availableTimeSlots = isLab
        ? ["13:30-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"]
        : timeSlots;
      const classroomType = isLab ? "Lab" : "Lecture Hall";

      let assignedHours = 0;
      while (assignedHours < subjectHours) {
        let assigned = false;

        for (const day of days) {
          if (assigned) break;
          for (const timeSlot of availableTimeSlots) {
            if (assigned) break;

            const slotKey = `${day}-${timeSlot}`;
            if (assignedSlots.has(slotKey)) continue;

            const suitableFaculties = faculties.filter((f) => {
              if (!f.subjects || f.subjects.length === 0) return true;
              return f.subjects.some((sub) =>
                sub.toString() === subject._id.toString()
              );
            });

            for (const faculty of suitableFaculties) {
              if (assigned) break;

              const suitableClassrooms = classrooms.filter(
                (c) =>
                  c.type === classroomType &&
                  c.capacity >= (batch.totalStudents || 60),
              );

              for (const classroom of suitableClassrooms) {
                if (assigned) break;

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
                  assignedHours++;
                  break;
                }
              }
            }
          }
        }

        if (!assigned) break; 
      }
    }

    const populatedSchedule = await Promise.all(
      schedule.map(async (entry) => {
        const [subject, faculty, classroom] = await Promise.all([
          Subject.findById(entry.subject).select("name code credits type"),
          Faculty.findById(entry.faculty).populate("user", "name"),
          Classroom.findById(entry.classroom).select("name building capacity type"),
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


const checkConflictsForSchedule = async (schedule, excludeTimetableId = null) => {
  const errors = [];

  for (const entry of schedule) {
    const facultyIds = [
      entry.faculty,
      ...(entry.parallelClasses || []).map(pc => pc.faculty)
    ].filter(Boolean);

    const classroomIds = [
      entry.classroom,
      ...(entry.parallelClasses || []).map(pc => pc.classroom)
    ].filter(Boolean);

    for (const facultyId of facultyIds) {
      const facultyConflict = await Timetable.findOne({
  _id: { $ne: excludeTimetableId },
  status: { $ne: "Archived" },
  schedule: {
    $elemMatch: {
      day: entry.day,
      timeSlot: entry.timeSlot,
      faculty: facultyId,
    },
  },
});

      if (facultyConflict) {
        const faculty = await Faculty.findById(facultyId).select("name");
        errors.push({
          type: "faculty",
          id: facultyId,
          name: faculty?.name || "Unknown Faculty",
          day: entry.day,
          timeSlot: entry.timeSlot,
          message: `Faculty "${faculty?.name || 'Unknown'}" is already assigned on ${entry.day} at ${entry.timeSlot}`,
        });
      }
    }

    for (const classroomId of classroomIds) {
      const classroomConflict = await Timetable.findOne({
  _id: { $ne: excludeTimetableId },
  status: { $ne: "Archived" },
  schedule: {
    $elemMatch: {
      day: entry.day,
      timeSlot: entry.timeSlot,
      classroom: classroomId,
    },
  },
});

      if (classroomConflict) {
        const classroom = await Classroom.findById(classroomId).select("name");
        errors.push({
          type: "classroom",
          id: classroomId,
          name: classroom?.name || "Unknown Classroom",
          day: entry.day,
          timeSlot: entry.timeSlot,
          message: `Classroom "${classroom?.name || 'Unknown'}" is already occupied on ${entry.day} at ${entry.timeSlot}`,
        });
      }
    }
  }

  return errors;
};

const populateTimetable = async (id) => {
  return await Timetable.findById(id)
    .populate({
      path: "batch",
      populate: {
        path: "semesters.subjects.subject",
      },
    })
    .populate("schedule.subject", "name code credits type department semester")
    .populate("schedule.faculty")
    .populate("schedule.classroom", "name building capacity type equipment availability")
    .populate("schedule.parallelClasses.subject", "name code")
    .populate("schedule.parallelClasses.faculty", "name")
    .populate("schedule.parallelClasses.classroom", "name building");
};

const createTimetableNotification = async (timetable, batchData, user) => {
  try {
    if (!batchData) {
      batchData = await StudentBatch.findById(timetable.batch);
    }

    const batchName = batchData?.name || batchData?.code || "Batch";
    const notificationMessage = `Time Table Created: ${timetable.name} for ${batchName} - Semester ${timetable.semester} (${timetable.academicYear})`;

    const recipients = await getNotificationRecipients(batchData, timetable);
    if (recipients.length === 0) return;

    const notification = new Notification({
      title: "Timetable Created",
      message: notificationMessage,
      type: "Schedule Change",
      priority: "High",
      recipients: recipients,
      sender: user?._id,
      relatedEntity: {
        type: "Timetable",
        id: timetable._id,
      },
      actionUrl: `/timetable/${timetable._id}`,
      isActive: true,
    });

    await notification.save();

    await sendEmailNotification(
      "New Timetable Created",
      `New timetable "${timetable.name}" has been created for Semester ${timetable.semester}. Please check dashboard.`
    );
  } catch (error) {
    console.error("Error creating timetable notification:", error);
  }
};

const createUpdateNotification = async (timetable, originalName, originalSchedule, updateData, user) => {
  try {
    const batchName = timetable.batch?.name || timetable.batch?.code || "Batch";

    let changeDetails = "";
    if (originalName !== updateData.name) {
      changeDetails += ` Name changed from "${originalName}" to "${updateData.name}".`;
    }

    const scheduleChanged = updateData.schedule
      ? JSON.stringify(originalSchedule) !== JSON.stringify(updateData.schedule)
      : false;

    if (scheduleChanged) {
      changeDetails += " Schedule has been modified.";
    }

    if (!changeDetails) return;

    const notificationMessage = `Time Table Updated: ${timetable.name} for ${batchName} - Semester ${timetable.semester} (${timetable.academicYear}).${changeDetails}`;

    const batchData = await StudentBatch.findById(timetable.batch._id);
    const recipients = await getNotificationRecipients(batchData, timetable);

    if (recipients.length === 0) return;

    const notification = new Notification({
      title: scheduleChanged ? "Timetable Updated (Schedule Changed)" : "Timetable Updated",
      message: notificationMessage,
      type: "Schedule Change",
      priority: "High",
      recipients: recipients,
      sender: user?._id,
      relatedEntity: {
        type: "Timetable",
        id: timetable._id,
      },
      actionUrl: `/timetable/${timetable._id}`,
      isActive: true,
    });

    await notification.save();

    await sendEmailNotification(
      "Timetable Updated",
      `Timetable "${timetable.name}" has been updated. Please check latest schedule.`
    );
  } catch (error) {
    console.error("Error creating update notification:", error);
  }
};

const createDeletionNotification = async (timetableInfo, user) => {
  try {
    const batchName = timetableInfo.batch?.name || timetableInfo.batch?.code || "Batch";
    const notificationMessage = `Time Table Deleted: ${timetableInfo.name} for ${batchName} - Semester ${timetableInfo.semester} (${timetableInfo.academicYear}) has been removed.`;

    const batchData = await StudentBatch.findById(timetableInfo.batch._id);
    const recipients = await getNotificationRecipients(batchData);

    if (recipients.length === 0) return;

    const notification = new Notification({
      title: "Timetable Deleted",
      message: notificationMessage,
      type: "Schedule Change",
      priority: "High",
      recipients: recipients,
      sender: user?._id,
      relatedEntity: {
        type: "Timetable",
        id: timetableInfo.id,
      },
      isActive: true,
    });

    await notification.save();

    await sendEmailNotification(
      "Timetable Deleted",
      `Timetable "${timetableInfo.name}" has been removed.`
    );
  } catch (error) {
    console.error("Error creating deletion notification:", error);
  }
};

const createPublicationNotification = async (timetable, user) => {
  try {
    const batchName = timetable.batch?.name || timetable.batch?.code || "Batch";
    const notificationMessage = `Time Table Published: ${timetable.name} for ${batchName} - Semester ${timetable.semester} (${timetable.academicYear}) is now available for viewing.`;

    const batchData = await StudentBatch.findById(timetable.batch._id);
    const recipients = await getNotificationRecipients(batchData, timetable);

    if (recipients.length === 0) return;

    const notification = new Notification({
      title: "Timetable Published",
      message: notificationMessage,
      type: "Schedule Change",
      priority: "High",
      recipients: recipients,
      sender: user?._id,
      relatedEntity: {
        type: "Timetable",
        id: timetable._id,
      },
      actionUrl: `/timetable/${timetable._id}`,
      isActive: true,
    });

    await notification.save();

    await sendEmailNotification(
      "Timetable Published",
      `Timetable "${timetable.name}" for Semester ${timetable.semester} has been published and is now available for viewing.`
    );
  } catch (error) {
    console.error("Error creating publication notification:", error);
  }
};

const getNotificationRecipients = async (batchData, timetable = null) => {
  const recipientsMap = new Map();

  const addRecipient = (id) => {
    if (!id) return;
    recipientsMap.set(id.toString(), { user: id, read: false });
  };

const users = await User.find({
  role: { $in: ["admin", "faculty", "user"] },
}).select("_id");

users.forEach((user) => addRecipient(user._id));

if (batchData?.coordinator) {
  addRecipient(batchData.coordinator);
}

if (timetable?.schedule) {
  const facultyIds = timetable.schedule
    .map((entry) => entry.faculty)
    .filter(Boolean);

  facultyIds.forEach((facultyId) => addRecipient(facultyId));
}

  return Array.from(recipientsMap.values());
};

const sendEmailNotification = async (subject, message) => {
  try {
    const users = await User.find({ role: "user", isActive: true }).select("email");
    const emails = users.map((u) => u.email).filter(Boolean);

    if (emails.length > 0) {
      await sendBulkEmail(emails, subject, message);
      console.log(`Email sent to ${emails.length} users`);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
};