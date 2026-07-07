import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: [true, "Faculty ID is required"],
  },
  facultyName: {
    type: String,
    required: [true, "Faculty name is required"],
  },
  department: {
    type: String,
    required: [true, "Department is required"],
  },
  leaveType: {
    type: String,
    enum: [
      "Casual Leave",
      "Sick Leave",
      "Annual Leave",
      "Earned Leave",
      "Maternity Leave",
      "Paternity Leave",
      "Study Leave",
      "Other",
    ],
    required: [true, "Leave type is required"],
  },
  fromDate: {
    type: Date,
    required: [true, "From date is required"],
  },
  toDate: {
    type: Date,
    required: [true, "To date is required"],
  },
  reason: {
    type: String,
    required: [true, "Reason is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  replacementFacultyId: {
    type: String,
    default: null,
  },
  replacementFacultyName: {
    type: String,
    default: null,
  },
  replacementFacultyEmail: {
    type: String,
    default: null,
  },
  replacementAssigned: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

leaveSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;