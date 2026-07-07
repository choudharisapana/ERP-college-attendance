import Faculty from "../models/Faculty.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import mongoose from "mongoose";

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

export const createFaculty = async (req, res) => {
  try {
    const facultyData = {
      ...req.body,
      status: true,
    };

    const faculty = await Faculty.create(facultyData);


    await createFacultyNotification({
      faculty,
      action: "created",
      senderId: req.user?._id,
      title: "Faculty Created",
      message: `Faculty "${faculty.name}" has been created successfully.`,
      type: "Schedule Change",
      priority: "High",
    });

    res.status(201).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }


    await createFacultyNotification({
      faculty,
      action: "updated",
      senderId: req.user?._id,
      title: "Faculty Updated",
      message: `Faculty "${faculty.name}" has been updated successfully.`,
      type: "Schedule Change",
      priority: "High",
    });

    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }


    const facultyName = faculty.name;
    const facultyId = faculty._id;
    const facultyEmail = faculty.email;

    await Faculty.findByIdAndDelete(req.params.id);

    await createFacultyNotification({
      faculty: { name: facultyName, _id: facultyId, email: facultyEmail },
      action: "deleted",
      senderId: req.user?._id,
      title: "Faculty Deleted",
      message: `Faculty "${facultyName}" has been deleted successfully.`,
      type: "Schedule Change",
      priority: "High",
    });

    res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const createFacultyNotification = async ({
  faculty,
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
    }).select("_id role");

    console.log("Recipients Found:", users.length);

    const recipients = users.map((user) => ({
      user: user._id,
      read: false,
    }));

    console.log("Total Recipients:", recipients.length);

    if (recipients.length === 0) {
      console.log("WARNING: No recipients! Notification will not be created.");
      return null;
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      priority,
      recipients,
      sender: senderId,
      relatedId: faculty._id,
      relatedModel: "Faculty",
      actionUrl: `/faculty/${faculty._id}`,
      isActive: true,
    });

    console.log(`Notification Created for ${action}:`, notification._id);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error.message);
    return null;
  }
};

export default {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
};