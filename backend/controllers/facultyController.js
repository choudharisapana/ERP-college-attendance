// backend/controllers/facultyController.js
import Faculty from "../models/Faculty.js";

// ✅ Get all faculty
export const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find();
    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get faculty by ID
export const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }
    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Create faculty
export const createFaculty = async (req, res) => {
  try {
    const facultyData = {
      ...req.body,
      status: true,
    };

    const faculty = await Faculty.create(facultyData);
    res.status(201).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Update faculty
export const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Delete faculty
export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};