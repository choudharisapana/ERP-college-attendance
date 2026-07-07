import StudentBatch from "../models/StudentBatch.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const getAllBatches = async (req, res) => {
  try {
    let filter = {};
    if (req.user?.role === "user") {
      let semesterNumber = null;
      if (
        req.user.semester !== undefined &&
        req.user.semester !== null &&
        req.user.semester !== ""
      ) {
        if (typeof req.user.semester === "number") {
          semesterNumber = req.user.semester;
        } else if (typeof req.user.semester === "string") {
          const match = req.user.semester.match(/\d+/);
          if (match) {
            semesterNumber = parseInt(match[0]);
          } else if (!isNaN(parseInt(req.user.semester))) {
            semesterNumber = parseInt(req.user.semester);
          }
        }
      }

      console.log("Parsed Semester:", semesterNumber);

      if (
        semesterNumber &&
        !isNaN(semesterNumber) &&
        semesterNumber > 0 &&
        semesterNumber <= 8
      ) {
        filter = {
          department: req.user.department,
          currentSemester: semesterNumber,
        };
        console.log("Filter applied:", filter);
      } else {
        console.log("Invalid semester, returning empty");
        return res.status(200).json({
          success: true,
          data: [],
          message: "Please update your semester in profile",
        });
      }
    } else if (req.user?.role === "faculty") {
      filter = {};
    } else if (req.user?.role === "admin") {
      filter = {};
    }

    console.log("Final Filter:", filter);

    const batches = await StudentBatch.find(filter).populate({
      path: "semesters.subjects.subject",
      model: "Subject",
    });

    console.log("Found Batches:", batches.length);

    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBatchById = async (req, res) => {
  try {
    const batch = await StudentBatch.findById(req.params.id).populate({
      path: "semesters.subjects.subject",
      model: "Subject",
    });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }
    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createBatch = async (req, res) => {
  try {
    const { currentSemester = 1, ...batchData } = req.body;

    const semesters = Array.from({ length: 8 }, (_, i) => ({
      semesterNumber: i + 1,
      subjects: [],
      isActive: i === 0,
    }));

    const newBatchData = {
      ...batchData,
      currentSemester,
      semesters,
    };

    const batch = new StudentBatch(newBatchData);
    await batch.save();
    await createBatchNotification({
      batch,
      action: "created",
      senderId: req.user?._id,
      title: "Batch Created",
      message: `Batch "${batch.name}" has been created successfully.`,
      type: "Schedule Change",
      priority: "High",
    });

    res.status(201).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBatch = async (req, res) => {
  try {
    const batch = await StudentBatch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    ).populate("semesters.subjects.subject");

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }
    await createBatchNotification({
      batch,
      action: "updated",
      senderId: req.user?._id,
      title: "Batch Updated",
      message: `Batch "${batch.name}" has been updated successfully.`,
      type: "Schedule Change",
      priority: "High",
    });
    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const batch = await StudentBatch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const batchName = batch.name;
    const batchId = batch._id;

    await StudentBatch.findByIdAndDelete(req.params.id);
    await createBatchNotification({
      batch: {
        _id: batchId,
        name: batchName,
      },
      action: "deleted",
      senderId: req.user?._id,
      title: "Batch Deleted",
      message: `Batch "${batchName}" has been deleted successfully.`,
      type: "Schedule Change",
      priority: "High",
    });

    res.status(200).json({
      success: true,
      message: "Batch deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBatchStats = async (req, res) => {
  try {
    const totalBatches = await StudentBatch.countDocuments();
    const activeBatches = await StudentBatch.countDocuments({
      status: "Active",
    });
    const batchesByDepartment = await StudentBatch.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBatches,
        activeBatches,
        batchesByDepartment,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addSubjectsToSemester = async (req, res) => {
  try {
    const { id, semesterNumber } = req.params;
    const { subjects } = req.body;

    const batch = await StudentBatch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const semesterIndex = batch.semesters.findIndex(
      (s) => s.semesterNumber == semesterNumber,
    );
    if (semesterIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    batch.semesters[semesterIndex].subjects.push(...subjects);
    await batch.save();

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeSubjectFromSemester = async (req, res) => {
  try {
    const { id, semesterNumber, subjectId } = req.params;

    const batch = await StudentBatch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const semesterIndex = batch.semesters.findIndex(
      (s) => s.semesterNumber == semesterNumber,
    );
    if (semesterIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    batch.semesters[semesterIndex].subjects = batch.semesters[
      semesterIndex
    ].subjects.filter((sub) => sub._id.toString() !== subjectId);

    await batch.save();

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSemesterSubjects = async (req, res) => {
  try {
    const { id, semesterNumber } = req.params;

    const batch = await StudentBatch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const semester = batch.semesters.find(
      (s) => s.semesterNumber == semesterNumber,
    );
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    const populatedSemester = await StudentBatch.populate(semester, {
      path: "subjects.subject",
      model: "Subject",
    });

    res.status(200).json({
      success: true,
      data: populatedSemester.subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createBatchNotification = async ({
  batch,
  action,
  senderId,
  title,
  message,
  type,
  priority,
}) => {
  try {
    const users = await User.find({
      role: { $in: ["admin", "faculty", "user"] },
    }).select("_id");

    const recipients = users.map((user) => ({
      user: user._id,
      read: false,
    }));

    if (recipients.length === 0) return;

    const notification = await Notification.create({
      title,
      message,
      type,
      priority,
      recipients,
      sender: senderId,
      relatedId: batch._id,
      relatedModel: "StudentBatch",
      relatedEntity: {
        type: "StudentBatch",
        id: batch._id,
      },
      actionUrl: `/batches/${batch._id}`,
      isActive: true,
    });

    console.log(`Batch ${action} notification created:`, notification._id);
  } catch (error) {
    console.error("Error creating batch notification:", error);
  }
};