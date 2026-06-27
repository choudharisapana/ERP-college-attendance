// backend/controllers/classroomController.js
import Classroom from "../models/Classroom.js";

// ✅ Get all classrooms
export const getClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find();
    res.status(200).json({
      success: true,
      data: classrooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get classroom by ID
export const getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }
    res.status(200).json({
      success: true,
      data: classroom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Create classroom
export const createClassroom = async (req, res) => {
  try {
    const classroomData = {
      ...req.body,
      status: true,
    };

    const classroom = await Classroom.create(classroomData);
    res.status(201).json({
      success: true,
      data: classroom,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Update classroom
export const updateClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    res.status(200).json({
      success: true,
      data: classroom,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Delete classroom
export const deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Classroom deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};