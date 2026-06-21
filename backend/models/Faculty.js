import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    department: {
      type: String,
      required: true,
    },

    subjects: {
      type: [String],
      default: [],
    },

    workload: {
      type: Number,
      required: true,
    },

    building: {
      type: String,
    },

    officeHours: {
      type: String,
    },

    phone: {
      type: String,
    },

    status: {
      type: Boolean,
      default: true,
    },

    facultyId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Faculty", facultySchema);