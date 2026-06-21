// models/Classroom.js
import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    building: {
      type: String,
      required: true,
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['Computer Science Engineering', 'Information Technology', 'Computer Technology', 
            'Industrial-IOT', 'Artificial Intelligence', 'Civil Engineering', 'Electrical Engineering', 
            'Mechanical Engineering', 'Robotics']
    },
    capacity: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Core", "Elective", "Lab", "Project", "Workshop", "Seminar"],
    },
    equipment: {
      type: [String],
      default: [],
    },
    availability: {
      type: String,
      required: true,
      enum: ['Available', 'In Use', 'Under Maintenance'],
      default: 'Available',
    },
    // AUTO-GENERATED CODE FIELD
    code: {
      type: String,
      unique: true,
      required: true,
      default: function() {
        // Auto-generate code: Building initial + Random number
        const buildingCode = this.building ? this.building.substring(0, 3).toUpperCase() : 'GEN';
        const randomNum = Math.floor(Math.random() * 1000);
        return `${buildingCode}-${Date.now().toString().slice(-4)}-${randomNum}`;
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Classroom", classroomSchema);