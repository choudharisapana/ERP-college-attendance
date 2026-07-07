import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    urgencyLevel: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    ticketNumber: {
      type: String,
      unique: true,
    },
    adminResponse: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

supportTicketSchema.pre("save", async function(next) {
  if (!this.ticketNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const count = await this.constructor.countDocuments();
    this.ticketNumber = `TKT-${year}${month}-${(count + 1).toString().padStart(4, "0")}`;
  }
  next();
});

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;