import Subject from "../models/Subject.js";

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

export const updateSubject = async (req, res) => {
  try {
    const { status, ...updateData } = req.body;

    const subject = await Subject.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

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

export const deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
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