// backend/controllers/authController.js
import User from "../models/User.js";
import validator from "validator";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js"; // Naya function

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      semester: user.semester,
      isActive: user.isActive,
      isVerified: user.isVerified, // 🔥 Add this
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  });
};

// Temporary email domains to block
const tempEmailDomains = [
  'mailinator.com', 'guerrillamail.com', '10minutemail.com',
  'yopmail.com', 'tempmail.com', 'throwawaymail.com',
  'temp-mail.org', 'fakeinbox.com', 'dispostable.com',
  'guerrillamail.net', 'guerrillamail.org', 'tempmail.net',
  'mailnator.com', 'trashmail.com', 'spamgourmet.com'
];

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const { name, email, password, role, department, semester, adminKey } =
      req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    if (name.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 3 characters",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    // 🔥 Check for temporary email domains
    const domain = email.split('@')[1].toLowerCase();
    if (tempEmailDomains.includes(domain)) {
      return res.status(400).json({
        success: false,
        message: "Temporary email addresses are not allowed. Please use Gmail, College email, or a real email address.",
      });
    }

    if (!email.endsWith("@college.edu") && !email.endsWith("@gmail.com")) {
      return res.status(400).json({
        success: false,
        message: "Use college or Gmail email",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Validate role
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'admin' or 'user'",
      });
    }

    const ADMIN_SECRET = process.env.ADMIN_SECRET;

    let finalRole = "user";

    if (role === "admin") {
      if (!adminKey || adminKey !== ADMIN_SECRET) {
        return res.status(403).json({
          success: false,
          message: "Invalid admin key",
        });
      }
      finalRole = "admin";
    }

    // Department and semester validation - ONLY for user role
    if (finalRole === "user") {
      if (!department || department === "") {
        return res.status(400).json({
          success: false,
          message: "Select a valid department",
        });
      }

      if (!semester || semester === "") {
        return res.status(400).json({
          success: false,
          message: "Select a valid semester",
        });
      }
    }

    // For admin, set default values
    const userDepartment = finalRole === "user" ? department : undefined;
    const userSemester = finalRole === "user" ? semester : undefined;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // 🔥 Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: finalRole,
      department: userDepartment,
      semester: userSemester,
      isVerified: false, // 🔥 Not verified yet
      verificationToken: verificationToken,
      verificationTokenExpiry: verificationTokenExpiry,
    });

    // 🔥 Send verification email (don't fail registration if email fails)
    try {
      const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(user, verificationLink);
      console.log(`Verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Still return success, but let user know to contact support if no email
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      requiresVerification: true,
      email: user.email,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Registration failed",
    });
  }
};

// ================= VERIFY EMAIL (NEW) =================
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token. Please register again or contact support.",
      });
    }

    // Update user as verified
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully! You can now login.",
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed. Please try again.",
    });
  }
};

// ================= RESEND VERIFICATION EMAIL (NEW) =================
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. You can login.",
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Send new verification email
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(user, verificationLink);

    res.json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
    });
  }
};

// ================= LOGIN (UPDATE - Check verification) =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password required",
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    if (
      !normalizedEmail.endsWith("@college.edu") &&
      !normalizedEmail.endsWith("@gmail.com")
    ) {
      return res.status(403).json({
        success: false,
        message: "Only college or Gmail allowed",
      });
    }

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 🔥 Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in. Check your inbox for the verification link.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// ================= GET ME =================
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// ================= LOGOUT =================
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Valid email required",
    });
  }

  res.status(200).json({
    success: true,
    message: "If account exists, reset link sent",
  });
};