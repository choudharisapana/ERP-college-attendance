const timetableGenerator = require('./services/timetableGenerator');

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

const validation = timetableGenerator.validateTimetable(timetable);
const csv = timetableGenerator.exportTimetable(timetable, 'csv');



