// routes/supportRoutes.js (or wherever your routes are)
import express from "express";
import {
  createSupportTicket,
  getTicketStatus,
  getAllTickets,
  updateTicketStatus,
  deleteTicket,
  getTicketsByEmail,
} from "../controllers/contactController.js";

const router = express.Router();

// Public routes
router.post("/tickets", createSupportTicket);
router.get("/tickets/:ticketNumber", getTicketStatus);
router.get("/my-tickets", getTicketsByEmail);

// Admin routes (add authentication middleware in production)
router.get("/tickets", getAllTickets);
router.put("/tickets/:ticketNumber/status", updateTicketStatus);
router.delete("/tickets/:ticketNumber", deleteTicket);

export default router;