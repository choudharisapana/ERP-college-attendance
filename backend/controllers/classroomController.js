import Classroom from "../models/Classroom.js";

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

export const createClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);

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

export const updateClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

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

export const deleteClassroom = async (req, res) => {
  try {
    await Classroom.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Classroom deleted",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};