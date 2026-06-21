import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Subject code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['Computer Science Engineering', 'Information Technology', 'Computer Technology', 
            'Industrial-IOT', 'Artificial Intelligence', 'Civil Engineering', 'Electrical Engineering', 
            'Mechanical Engineering', 'Robotics']
    },
    credits: {
        type: Number,
        required: [true, 'Credits are required'],
        min: 1,
        max: 10
    },
    type: {
        type: String,
        required: [true, 'Subject type is required'],
        enum: ['Core', 'Elective', 'Lab', 'Project', 'Workshop', 'Seminar']
    },
    semester: {
        type: String,
        required: [true, 'Semester is required'],
        enum: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
            'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'],
        default: 'Semester 1'
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

subjectSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;