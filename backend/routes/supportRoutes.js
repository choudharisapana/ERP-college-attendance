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
router.post("/tickets", createSupportTicket);
router.get("/tickets/:ticketNumber", getTicketStatus);
router.get("/my-tickets", getTicketsByEmail);
router.get("/tickets", getAllTickets);
router.put("/tickets/:ticketNumber/status", updateTicketStatus);
router.delete("/tickets/:ticketNumber", deleteTicket);

export default router;