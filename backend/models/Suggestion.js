import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema(
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
    occupation: {
      type: String,
      enum: ["Student", "Teacher", "Admin", "Other"],
      default: "Student",
    },
    category: {
      type: String,
      enum: [
        "Feature Request",
        "Bug Report",
        "Improvement",
        "UI/UX Feedback",
        "Performance",
        "General Feedback",
      ],
      default: "Feature Request",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    suggestion: {
      type: String,
      required: [true, "Suggestion is required"],
      trim: true,
      maxlength: [1000, "Suggestion cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Approved", "Implemented", "Rejected"],
      default: "Pending",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    adminResponse: {
      type: String,
      default: "",
    },
    implementedDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Index for better query performance
suggestionSchema.index({ category: 1, status: 1, createdAt: -1 });

const Suggestion = mongoose.model("Suggestion", suggestionSchema);
export default Suggestion;