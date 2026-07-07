import Suggestion from "../models/Suggestion.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
import getSuggestionEmailTemplate from "../utils/emailTemplates.js";

export const getSuggestions = async (req, res) => {
  try {
    const {
      category,
      status,
      priority,
      sort = "latest",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (category && category !== "All") filter.category = category;
    if (status && status !== "All") filter.status = status;
    if (priority && priority !== "All") filter.priority = priority;

    let sortOption = {};
    switch (sort) {
      case "latest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "most-upvoted":
        sortOption = { upvotes: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Suggestion.countDocuments(filter);
    const suggestions = await Suggestion.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email")
      .lean();

    const stats = {
      total: await Suggestion.countDocuments(),
      pending: await Suggestion.countDocuments({ status: "Pending" }),
      underReview: await Suggestion.countDocuments({ status: "Under Review" }),
      implemented: await Suggestion.countDocuments({ status: "Implemented" }),
      featureRequests: await Suggestion.countDocuments({
        category: "Feature Request",
      }),
    };

    res.json({
      success: true,
      suggestions,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch suggestions",
    });
  }
};

export const getSuggestionById = async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id)
      .populate("userId", "name email")
      .lean();

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found",
      });
    }

    res.json({
      success: true,
      suggestion,
    });
  } catch (error) {
    console.error("Error fetching suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch suggestion",
    });
  }
};

export const createSuggestion = async (req, res) => {
  try {
    const { name, email, category, priority, suggestion, isAnonymous, occupation } =
      req.body;

    if (!name || !email || !suggestion) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and suggestion",
      });
    }

    const newSuggestion = await Suggestion.create({
      name: isAnonymous ? "Anonymous" : name,
      email: isAnonymous ? "anonymous@eduscheduler.com" : email,
      category: category || "Feature Request",
      priority: priority || "Medium",
      suggestion: suggestion,
      isAnonymous: isAnonymous || false,
      userId: req.user?._id || null,
      occupation: occupation || "Student",
    });

    try {
      const adminEmail =
        process.env.EMAIL_USER || "supporteduschedular@gmail.com";

      const emailHtml = getSuggestionEmailTemplate({
        userName: isAnonymous ? "Anonymous User" : name,
        userEmail: isAnonymous ? "anonymous@eduscheduler.com" : email,
        suggestion: suggestion,
        category: category || "Feature Request",
        priority: priority || "Medium",
        suggestionId: newSuggestion._id,
      });

      await sendEmail(adminEmail, "New Suggestion Received", emailHtml);

    } catch (emailError) {
      console.log("Email notification failed:", emailError.message);
    }

    res.status(201).json({
      success: true,
      message: "Suggestion submitted successfully",
      suggestion: {
        id: newSuggestion._id,
        name: newSuggestion.name,
        category: newSuggestion.category,
        priority: newSuggestion.priority,
        status: newSuggestion.status,
        createdAt: newSuggestion.createdAt,
      },
    });
  } catch (error) {
    console.error("Error submitting suggestion:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit suggestion",
    });
  }
};

export const upvoteSuggestion = async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found",
      });
    }

    const hasUpvoted =
      suggestion.upvotedBy && suggestion.upvotedBy.includes(req.user._id);

    if (hasUpvoted) {
      suggestion.upvotes = (suggestion.upvotes || 0) - 1;
      suggestion.upvotedBy = suggestion.upvotedBy.filter(
        (id) => id.toString() !== req.user._id.toString(),
      );
    } else {
      suggestion.upvotes = (suggestion.upvotes || 0) + 1;
      if (!suggestion.upvotedBy) suggestion.upvotedBy = [];
      suggestion.upvotedBy.push(req.user._id);
    }

    await suggestion.save();

    res.json({
      success: true,
      upvotes: suggestion.upvotes,
      hasUpvoted: !hasUpvoted,
    });
  } catch (error) {
    console.error("Error upvoting suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upvote suggestion",
    });
  }
};

export const updateSuggestionStatus = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found",
      });
    }

    const oldStatus = suggestion.status;
    suggestion.status = status || suggestion.status;
    if (adminResponse) suggestion.adminResponse = adminResponse;
    if (status === "Implemented") suggestion.implementedDate = new Date();

    await suggestion.save();
    try {
      if (oldStatus !== status && suggestion.userId) {
        let statusMessage = "";
        switch (status) {
          case "Under Review":
            statusMessage = "is now under review";
            break;
          case "Implemented":
            statusMessage = "has been implemented!";
            break;
          case "Pending":
            statusMessage = "is pending review";
            break;
          default:
            statusMessage = `has been marked as ${status}`;
        }

        const notificationMessage = `Your suggestion "${suggestion.suggestion.substring(0, 100)}${suggestion.suggestion.length > 100 ? "..." : ""}" ${statusMessage}${adminResponse ? `\n\nAdmin response: ${adminResponse}` : ""}`;

        await Notification.create({
          title: `Suggestion ${status.toUpperCase()}`,
          message: notificationMessage,
          type: "suggestion",
          priority: "Medium",
          recipients: [
            {
              user: suggestion.userId,
              read: false,
            },
          ],
          sender: req.user._id,
          relatedEntity: {
            type: "Suggestion",
            id: suggestion._id,
          },
          category: suggestion.category,
          relatedId: suggestion._id,
          relatedModel: "Suggestion",
          isActive: true,
        });

        console.log(
          `In-app status notification sent to user: ${suggestion.userId}`,
        );
      }
    } catch (notificationError) {
      console.error("Failed to send status notification:", notificationError);
    }

    res.json({
      success: true,
      message: "Suggestion updated successfully",
      suggestion,
    });
  } catch (error) {
    console.error("Error updating suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update suggestion",
    });
  }
};

export const getSuggestionStats = async (req, res) => {
  try {
    const [
      total,
      pending,
      underReview,
      implemented,
      featureRequests,
      bugReports,
    ] = await Promise.all([
      Suggestion.countDocuments(),
      Suggestion.countDocuments({ status: "Pending" }),
      Suggestion.countDocuments({ status: "Under Review" }),
      Suggestion.countDocuments({ status: "Implemented" }),
      Suggestion.countDocuments({ category: "Feature Request" }),
      Suggestion.countDocuments({ category: "Bug Report" }),
    ]);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        underReview,
        implemented,
        featureRequests,
        bugReports,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

export const getAdminSuggestionNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const notifications = await Notification.find({
      "recipients.user": req.user._id,
      type: "suggestion",
    }).sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      "recipients.user": req.user._id,
      "recipients.read": false,
      type: "suggestion",
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin notifications",
    });
  }
};

export const getUserSuggestionNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      "recipients.user": req.user._id,
      type: "suggestion",
    }).sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      "recipients.user": req.user._id,
      "recipients.read": false,
      type: "suggestion",
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user notifications",
    });
  }
};