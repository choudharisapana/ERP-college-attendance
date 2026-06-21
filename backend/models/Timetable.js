import mongoose from 'mongoose';

const parallelClassSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  type: {
    type: String,
    enum: ['Core', 'Elective', 'Lab', 'Project', 'Workshop', 'Seminar'],
    default: 'Theory'
  },
  batchDivision: {
    type: String,
    enum: ['B1', 'B2', 'B3', null],
    default: null
  },
  studentCount: {
    type: Number,
    default: 0
  }
});

const scheduleEntrySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  },
  type: {
    type: String,
    enum: ['Core', 'Elective', 'Lab', 'Project', 'Workshop', 'Seminar'],
    default: 'Theory'
  },
  batchDivision: {
    type: String,
    enum: ['B1', 'B2', 'B3', null],
    default: null
  },
  studentCount: {
    type: Number,
    default: 0
  },
  parallelClasses: [parallelClassSchema]
});

const breakSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'break'
  }
});

const timetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentBatch',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  academicYear: {
    type: String,
    required: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  schedule: [scheduleEntrySchema],
  breaks: [breakSchema],
  totalStudents: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
timetableSchema.index({ batch: 1, semester: 1, academicYear: 1 });
timetableSchema.index({ status: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;