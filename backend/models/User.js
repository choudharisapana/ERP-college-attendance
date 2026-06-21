// backend/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  department: {
    type: String,
    required: function() {
      return this.role === 'user';
    }
  },
  semester: {
    type: String,
    required: function() {
      return this.role === 'user';
    },
    enum: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 
           'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // 🔥 NEW FIELDS FOR EMAIL VERIFICATION 🔥
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpiry: {
    type: Date,
    default: null
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' }
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// JWT Token method
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET || "eduscheduler-secret-key", {
    expiresIn: "30d",
  });
};

// Password comparison method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;