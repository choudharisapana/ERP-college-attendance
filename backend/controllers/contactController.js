// controllers/contactController.js
import SupportTicket from "../models/SupportTicket.js";
import emailService from "../services/emailService.js";

/**
 * @desc    Create a new support ticket
 * @route   POST /api/support/tickets
 * @access  Public
 */
export const createSupportTicket = async (req, res) => {
  try {
    const { name, email, subject, message, urgencyLevel } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      console.log("Validation failed: Missing fields");
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, email, subject, message",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Create ticket
    const ticket = new SupportTicket({
      name,
      email,
      subject,
      message,
      urgencyLevel: urgencyLevel || "medium",
    });

    await ticket.save();
    console.log("Ticket created:", ticket.ticketNumber);

    // Send emails (don't fail if email fails)
    const emailResults = {
      userConfirmation: false,
      adminNotification: false
    };

    try {
      // 1. Send confirmation to USER (who submitted the ticket)
      const userResult = await emailService.sendSupportConfirmation(ticket);
      emailResults.userConfirmation = userResult.success;
      console.log(`User confirmation email sent to ${ticket.email}:`, userResult.success);
    } catch (emailError) {
      console.error("Failed to send user confirmation email:", emailError.message);
    }

    try {
      // 2. Send notification to ADMIN
      const adminResult = await emailService.sendSupportNotification(ticket);
      emailResults.adminNotification = adminResult.success;
      console.log("Admin notification email sent:", adminResult.success);
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError.message);
    }

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket: {
        number: ticket.ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
      emailStatus: emailResults
    });
  } catch (error) {
    console.error("❌ Error creating support ticket:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create support ticket",
    });
  }
};

/**
 * @desc    Get ticket status by ticket number
 * @route   GET /api/support/tickets/:ticketNumber
 * @access  Public
 */
export const getTicketStatus = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    if (!ticketNumber) {
      return res.status(400).json({
        success: false,
        message: "Ticket number is required",
      });
    }

    const ticket = await SupportTicket.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      ticket: {
        number: ticket.ticketNumber,
        status: ticket.status,
        subject: ticket.subject,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
    });
  }
};

/**
 * @desc    Get all tickets (Admin only)
 * @route   GET /api/support/tickets
 * @access  Private/Admin
 */
export const getAllTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
    });
  }
};

/**
 * @desc    Update ticket status (Admin only)
 * @route   PUT /api/support/tickets/:ticketNumber/status
 * @access  Private/Admin
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const { status, response } = req.body;

    const validStatuses = ["open", "in-progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Valid statuses: open, in-progress, resolved, closed",
      });
    }

    const ticket = await SupportTicket.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = status;
    
    // If admin adds a response, you might want to store it
    if (response) {
      ticket.adminResponse = response;
    }

    await ticket.save();

    // Optionally send email notification about status update
    if (status === "resolved" || status === "closed") {
      try {
        await emailService.sendTicketStatusUpdate(ticket);
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError.message);
      }
    }

    res.json({
      success: true,
      message: "Ticket status updated successfully",
      ticket: {
        number: ticket.ticketNumber,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
    });
  }
};

/**
 * @desc    Delete a ticket (Admin only)
 * @route   DELETE /api/support/tickets/:ticketNumber
 * @access  Private/Admin
 */
export const deleteTicket = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await SupportTicket.findOneAndDelete({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
    });
  }
};

/**
 * @desc    Get tickets by email (User can check their tickets)
 * @route   GET /api/support/my-tickets
 * @access  Public
 */
export const getTicketsByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const tickets = await SupportTicket.find({ email })
      .sort({ createdAt: -1 })
      .select("ticketNumber status subject urgencyLevel createdAt");

    res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
    });
  }
};