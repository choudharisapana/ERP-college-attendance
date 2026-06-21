import Faculty from "../models/Faculty.js";

// GET all faculty
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

// CREATE faculty
export const createFaculty = async (req, res) => {
 try {
    const faculty = await Faculty.create(req.body);
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

// UPDATE faculty
export const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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

// DELETE faculty (soft delete)
export const deleteFaculty = async (req, res) => {
  try {
   await Faculty.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Faculty deleted",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};