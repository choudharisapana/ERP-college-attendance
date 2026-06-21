import mongoose from "mongoose";

const dashboardSchema = new mongoose.Schema({
  // This is a singleton model - only one document will exist
  _id: { type: String, default: 'dashboard' },
  
  // Statistics (auto-updated via aggregation)
  stats: {
    totalBatches: { type: Number, default: 0 },
    activeBatches: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
    totalFaculty: { type: Number, default: 0 },
    totalClassrooms: { type: Number, default: 0 },
    availableClassrooms: { type: Number, default: 0 },
    totalSubjects: { type: Number, default: 0 },
    totalTimetables: { type: Number, default: 0 },
    publishedTimetables: { type: Number, default: 0 }
  },

  // Charts data - Fixed schema definitions
  charts: {
    batchesByDepartment: [{
      department: { type: String },
      count: { type: Number, default: 0 },
      students: { type: Number, default: 0 }
    }],
    
    facultyByDepartment: [{
      department: { type: String },
      count: { type: Number, default: 0 },
      avgWorkload: { type: Number, default: 0 }
    }],
    
    subjectsByType: [{
      type: { type: String },
      count: { type: Number, default: 0 },
      totalCredits: { type: Number, default: 0 }
    }],
    
    classroomsByType: [{
      type: { type: String },  // ✅ FIXED: Properly define as object, not string
      count: { type: Number, default: 0 },
      totalCapacity: { type: Number, default: 0 }
    }],
    
    timetablesByStatus: [{
      status: { type: String },
      count: { type: Number, default: 0 }
    }],
    
    timetableCompletion: [{
      batch: { type: String, default: '' },
      scheduled: { type: Number, default: 0 },
      total: { type: Number, default: 30 },
      percentage: { type: Number, default: 0 }
    }]
  },

  // Recent activities
  recentActivities: [{
    type: { 
      type: String, 
      enum: ['batch', 'faculty', 'subject', 'classroom', 'timetable'],
      required: true
    },
    action: { 
      type: String, 
      enum: ['created', 'updated', 'deleted'],
      required: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    itemName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    user: {
      type: String,
      default: 'System'
    }
  }],

  // Upcoming events
  upcomingEvents: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['exam', 'holiday', 'event', 'meeting', 'deadline'],
      default: 'event'
    },
    date: {
      type: Date,
      required: true
    },
    description: String,
    relatedTo: {
      type: { type: String },
      id: mongoose.Schema.Types.ObjectId
    }
  }],

  // Resource utilization
  resourceUtilization: {
    classrooms: [{
      building: { type: String },
      total: { type: Number, default: 0 },
      inUse: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      maintenance: { type: Number, default: 0 }
    }],
    
    facultyWorkload: [{
      range: { type: String },
      count: { type: Number, default: 0 }
    }]
  },

  // AUTO-GENERATED CODE FIELD
  code: {
    type: String,
    unique: true,
    default: function() {
      const randomNum = Math.floor(Math.random() * 1000);
      return `DASH-${Date.now().toString().slice(-6)}-${randomNum}`;
    }
  },

  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  _id: false 
});

// Ensure only one document exists
dashboardSchema.statics.ensureDashboard = async function() {
  const dashboard = await this.findById('dashboard');
  if (!dashboard) {
    return await this.create({ _id: 'dashboard' });
  }
  return dashboard;
};

// Method to update statistics
dashboardSchema.methods.updateStats = async function() {
  this.lastUpdated = new Date();
  return this.save();
};

// Index for better performance
dashboardSchema.index({ lastUpdated: -1 });

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

export default Dashboard;