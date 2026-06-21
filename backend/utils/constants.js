module.exports = {
  // User roles - REMOVE FACULTY
  ROLES: {
    ADMIN: 'admin',
    USER: 'user'
  },

  // Classroom types
  CLASSROOM_TYPES: [
    'Lecture Hall',
    'Seminar Room',
    'Workshop',
    'Lab',
    'Computer Lab',
    'Conference Room'
  ],

  // Subject types
  SUBJECT_TYPES: [
    'Core',
    'Elective',
    'Lab',
    'Project',
    'Workshop',
    'Seminar'
  ],

  // Timetable status
  TIMETABLE_STATUS: {
    DRAFT: 'Draft',
    PENDING_REVIEW: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected'
  },

  // Days of week
  DAYS: [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ],

  // Time slots
  TIME_SLOTS: [
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00'
  ],

  // Departments - Add your departments here
  DEPARTMENTS: [
    'Computer Science Engineering',
    'Information Technology',
    'Computer Technology',
    'Industrial-IOT',
    'Artificial Intelligence',
    'Civil Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Robotics'
  ],

  // Notification types
  NOTIFICATION_TYPES: {
    INFO: 'info',
    WARNING: 'warning',
    SUCCESS: 'success',
    ERROR: 'error',
    SCHEDULE: 'schedule',
    SYSTEM: 'system'
  },

  // File upload limits
  UPLOAD_LIMITS: {
    AVATAR: 2 * 1024 * 1024, // 2MB
    DOCUMENT: 5 * 1024 * 1024, // 5MB
    IMAGE: 5 * 1024 * 1024 // 5MB
  },

  // Academic years
  ACADEMIC_YEARS: [
    '2023-2024',
    '2024-2025',
    '2025-2026',
    '2026-2027'
  ],
  SEMESTERS: [
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8'
  ]
};