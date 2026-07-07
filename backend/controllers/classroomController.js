import Classroom from "../models/Classroom.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

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

export const createClassroom = async (req, res) => {
  try {
    const classroomData = {
      ...req.body,
      status: true,
    };

    const classroom = await Classroom.create(classroomData);
    await createClassroomNotification({
      classroom,
      action: "created",
      senderId: req.user?._id,
      title: "Classroom Created",
      message: `Classroom "${classroom.name}" has been created successfully.`,
      type: "Schedule Change",
      priority: "High",
    });
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

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    await createClassroomNotification({
      classroom,
      action: "updated",
      senderId: req.user?._id,
      title: "Classroom Updated",
      message: `Classroom "${classroom.name}" has been updated successfully.`,
      type: "Schedule Change",
      priority: "High",
    });

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
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    const classroomName = classroom.name;
    const classroomId = classroom._id;

    await Classroom.findByIdAndDelete(req.params.id);
    await createClassroomNotification({
      classroom: {
        _id: classroomId,
        name: classroomName,
      },
      action: "deleted",
      senderId: req.user?._id,
      title: "Classroom Deleted",
      message: `Classroom "${classroomName}" has been deleted successfully.`,
      type: "Schedule Change",
      priority: "High",
    });

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

const createClassroomNotification = async ({
  classroom,
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
      relatedId: classroom._id,
      relatedModel: "Classroom",
      relatedEntity: {
        type: "Classroom",
        id: classroom._id,
      },
      actionUrl: `/classrooms/${classroom._id}`,
      isActive: true,
    });

    console.log(`Classroom ${action} notification created:`, notification._id);
  } catch (error) {
    console.error("Error creating classroom notification:", error);
  }
};