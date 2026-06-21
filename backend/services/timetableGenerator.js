const timetableGenerator = require('./services/timetableGenerator');

// Generate timetable
const timetable = await timetableGenerator.generateAutomaticTimetable({
  department: 'Computer Science',
  academicYear: '2024-2025',
  semester: 1,
  batches: ['batchId1', 'batchId2'],
  preferences: {
    maxHoursPerDay: 6,
    avoidBackToBack: true
  }
});

// Validate timetable
const validation = timetableGenerator.validateTimetable(timetable);

// Export to CSV
const csv = timetableGenerator.exportTimetable(timetable, 'csv');