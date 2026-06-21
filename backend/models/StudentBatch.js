import mongoose from "mongoose";

const studentBatchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    startYear: {
      type: Number,
      required: true,
    },
    endYear: {
      type: Number,
      required: true,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    // ✅ Current semester field add करें
    currentSemester: {
      type: Number,
      default: 1,
      min: 1,
      max: 8,
    },
    status: {
      type: String,
      enum: ["Active", "Graduated", "Inactive"],
      default: "Active",
    },
    semesters: [
      {
        semesterNumber: {
          type: Number,
          required: true,
        },
        subjects: [
          {
            subject: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Subject",
            },
            faculty: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Faculty",
            },
            credits: {
              type: Number,
              default: 3,
            },
            coordinator: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          },
        ],
        isActive: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const StudentBatch = mongoose.model("StudentBatch", studentBatchSchema);
export default StudentBatch;