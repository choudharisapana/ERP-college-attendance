import Suggestion from "../models/Suggestion.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
import getSuggestionEmailTemplate from "../utils/emailTemplates.js";

// @desc    Get all suggestions (Public - all users can see)
// @route   GET /api/suggestions
// @access  Public
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

    // Build filter
    const filter = {};
    if (category && category !== "All") filter.category = category;
    if (status && status !== "All") filter.status = status;
    if (priority && priority !== "All") filter.priority = priority;

    // Build sort
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

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const total = await Suggestion.countDocuments(filter);

    // Get suggestions
    const suggestions = await Suggestion.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email")
      .lean();

    // Get stats for all suggestions
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

// @desc    Get single suggestion by ID (Public)
// @route   GET /api/suggestions/:id
// @access  Public
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

// @access  Public/Private (anyone can submit)
export const createSuggestion = async (req, res) => {
  try {
    const { name, email, category, priority, suggestion, isAnonymous, occupation } =
      req.body;

    // Validate required fields
    if (!name || !email || !suggestion) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and suggestion",
      });
    }

    // Create suggestion
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

    // EMAIL NOTIFICATION - Send email to ONLY ONE email
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

      // console.log(`Email sent to: ${adminEmail}`);
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

// @access  Private (requires login)
export const upvoteSuggestion = async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found",
      });
    }

    // Check if user already upvoted
    const hasUpvoted =
      suggestion.upvotedBy && suggestion.upvotedBy.includes(req.user._id);

    if (hasUpvoted) {
      // Remove upvote
      suggestion.upvotes = (suggestion.upvotes || 0) - 1;
      suggestion.upvotedBy = suggestion.upvotedBy.filter(
        (id) => id.toString() !== req.user._id.toString(),
      );
    } else {
      // Add upvote
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

// @desc    Update suggestion status (Admin only)
// @route   PUT /api/suggestions/:id/status
// @access  Private/Admin
export const updateSuggestionStatus = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    // Check if user is admin
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

    // NOTIFICATION: Notify the user who submitted the suggestion about status update (IN-APP)
    try {
      // Don't send notification if status didn't change or no user associated
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

// @desc    Get suggestion statistics
// @route   GET /api/suggestions/stats/overview
// @access  Public
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

// Admin Notifications (In-app)
export const getAdminSuggestionNotifications = async (req, res) => {
  try {
    // Only admin check
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

// User Notifications (In-app)
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