import Subject from "../models/Subject.js";
import Faculty from "../models/Faculty.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const getSubjects = async (req, res) => {
  console.log("getMySubjects called");
  console.log("User:", req.user);

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

export const getMySubjects = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user.id });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    let subjects = [];
    if (faculty.subjects && faculty.subjects.length > 0) {
      subjects = await Subject.find({
        _id: { $in: faculty.subjects },
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

export const getSubjectById = async (req, res) => {
  console.log("getSubjectById called:", req.params.id);
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

export const createSubject = async (req, res) => {
  try {
    const subjectData = {
      ...req.body,
      status: true,
    };

    const subject = await Subject.create(subjectData);
    await createSubjectNotification({
      subject,
      action: "created",
      senderId: req.user?._id,
      title: "Subject Created",
      message: `Subject "${subject.name}" has been created successfully.`,
      type: "Schedule Change",
      priority: "High",
    });
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

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    await createSubjectNotification({
      subject,
      action: "updated",
      senderId: req.user?._id,
      title: "Subject Updated",
      message: `Subject "${subject.name}" has been updated successfully.`,
      type: "Schedule Change",
      priority: "High",
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
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const subjectName = subject.name;
    const subjectId = subject._id;

    await Subject.findByIdAndDelete(req.params.id);

    await createSubjectNotification({
      subject: {
        _id: subjectId,
        name: subjectName,
      },
      action: "deleted",
      senderId: req.user?._id,
      title: "Subject Deleted",
      message: `Subject "${subjectName}" has been deleted successfully.`,
      type: "Schedule Change",
      priority: "High",
    });

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

const createSubjectNotification = async ({
  subject,
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
      relatedId: subject._id,
      relatedModel: "Subject",
      relatedEntity: {
        type: "Subject",
        id: subject._id,
      },
      actionUrl: `/subjects/${subject._id}`,
      isActive: true,
    });

    console.log(`Subject ${action} notification created:`, notification._id);
  } catch (error) {
    console.error("Error creating subject notification:", error);
  }
};