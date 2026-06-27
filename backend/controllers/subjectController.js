// backend/controllers/subjectController.js
import Subject from "../models/Subject.js";
import Faculty from "../models/Faculty.js";

// ✅ Admin - Get all subjects
export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Faculty - Get only their subjects
export const getMySubjects = async (req, res) => {
  try {
    // Faculty ki ID se uske subjects find karo
    const faculty = await Faculty.findOne({ userId: req.user.id });
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }

    // Agar faculty ke subjects array mein subject IDs hain toh unhe fetch karo
    let subjects = [];
    if (faculty.subjects && faculty.subjects.length > 0) {
      subjects = await Subject.find({
        _id: { $in: faculty.subjects }
      });
    }

    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error("Error fetching faculty subjects:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get subject by ID
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }
    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Admin - Create subject
export const createSubject = async (req, res) => {
  try {
    const subjectData = {
      ...req.body,
      status: true,
    };

    const subject = await Subject.create(subjectData);
    res.status(201).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Admin - Update subject
export const updateSubject = async (req, res) => {
  try {
    const { status, ...updateData } = req.body;

    const subject = await Subject.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Admin - Delete subject
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Subject deleted",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};