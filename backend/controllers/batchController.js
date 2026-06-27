// backend/controllers/batchController.js
import StudentBatch from "../models/StudentBatch.js";

export const getAllBatches = async (req, res) => {
  try {
    let filter = {};

    // ✅ STUDENT FILTER - Safe parsing
    if (req.user?.role === "user") {

      let semesterNumber = null;

      if (req.user.semester !== undefined && req.user.semester !== null && req.user.semester !== "") {
        // Case 1: Already a number
        if (typeof req.user.semester === "number") {
          semesterNumber = req.user.semester;
        }
        // Case 2: String with "Semester 1" format
        else if (typeof req.user.semester === "string") {
          // "Semester 1" se number nikalna
          const match = req.user.semester.match(/\d+/);
          if (match) {
            semesterNumber = parseInt(match[0]);
          } else if (!isNaN(parseInt(req.user.semester))) {
            // Direct number string "3"
            semesterNumber = parseInt(req.user.semester);
          }
        }
      }

      console.log("🔢 Parsed Semester:", semesterNumber);

      // ✅ Agar semester number valid hai toh filter lagao
      if (semesterNumber && !isNaN(semesterNumber) && semesterNumber > 0 && semesterNumber <= 8) {
        filter = {
          department: req.user.department,
          currentSemester: semesterNumber,
        };
        console.log("✅ Filter applied:", filter);
      } else {
        console.log("⚠️ Invalid semester, returning empty");
        return res.status(200).json({
          success: true,
          data: [],
          message: "Please update your semester in profile"
        });
      }
    }

    // ✅ FACULTY FILTER
  
else if (req.user?.role === "faculty") {
  // temporary fix
  filter = {};
}


    // ✅ ADMIN - No filter
    else if (req.user?.role === "admin") {
      filter = {};
    }

    console.log("🔍 Final Filter:", filter);

    const batches = await StudentBatch.find(filter).populate({
      path: "semesters.subjects.subject",
      model: "Subject",
    });

    console.log("📦 Found Batches:", batches.length);

    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error("❌ Error:", error);
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

    // Generate default semesters
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
    const batch = await StudentBatch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

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


