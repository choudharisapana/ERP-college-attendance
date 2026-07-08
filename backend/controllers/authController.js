import User from "../models/User.js";
import validator from "validator";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";
import { sendResetEmail } from "../utils/sendResetEmail.js";

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
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  });
};

const tempEmailDomains = [
  'mailinator.com', 'guerrillamail.com', '10minutemail.com',
  'yopmail.com', 'tempmail.com', 'throwawaymail.com',
  'temp-mail.org', 'fakeinbox.com', 'dispostable.com',
  'guerrillamail.net', 'guerrillamail.org', 'tempmail.net',
  'mailnator.com', 'trashmail.com', 'spamgourmet.com'
];

export const register = async (req, res) => {
  try {
    const { name, email, password, role, department, semester, adminKey, facultyKey } = req.body;

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

    const domain = email.split('@')[1].toLowerCase();
    if (tempEmailDomains.includes(domain)) {
      return res.status(400).json({
        success: false,
        message: "Temporary email addresses are not allowed.",
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

    if (!["admin", "user", "faculty"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'admin', 'user', or 'faculty'",
      });
    }

    const ADMIN_SECRET = process.env.ADMIN_SECRET;
    const FACULTY_SECRET = process.env.FACULTY_SECRET;
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

    else if (role === "faculty") {
      if (!facultyKey || facultyKey !== FACULTY_SECRET) {
        return res.status(403).json({
          success: false,
          message: "Invalid faculty key",
        });
      }
      finalRole = "faculty";
    }

    else {
      finalRole = "user";
    }

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

    const userDepartment = finalRole === "user" ? department : undefined;
    const userSemester = finalRole === "user" ? semester : undefined;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: finalRole,
      department: userDepartment,
      semester: userSemester,
      isVerified: false,
      verificationToken: verificationToken,
      verificationTokenExpiry: verificationTokenExpiry,
    });

   const verificationLink =
  `${process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;

// Response immediately
res.status(201).json({
  success: true,
  message:
    "Registration successful! Verification email will be sent shortly.",
  requiresVerification: true,
  email: user.email,
});

// Send email in background
sendVerificationEmail(user, verificationLink)
  .then(() => {
    console.log(`✅ Verification email sent to ${user.email}`);
  })
  .catch((err) => {
    console.error("❌ Verification email failed:", err.message);
  });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Registration failed",
    });
  }
};

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

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
sendVerificationEmail(user, verificationLink)
  .then(() => {
    console.log(`✅ Verification email resent to ${user.email}`);
  })
  .catch((err) => {
    console.error("❌ Resend email failed:", err.message);
  });


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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith("@college.edu") && !normalizedEmail.endsWith("@gmail.com")) {
      return res.status(403).json({
        success: false,
        message: "Only college or Gmail allowed",
      });
    }

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

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If account exists, reset link sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    res.status(200).json({
  success: true,
  message: "If account exists, reset link will be sent shortly.",
});

sendResetEmail(user, resetLink)
  .then(() => {
    console.log(`Reset email sent to ${user.email}`);
  })
  .catch((err) => {
    console.error("Reset email failed:", err.message);
  });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token. Please request a new one.",
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    console.log("CHANGE PASSWORD CONTROLLER HIT");
    console.log("Request Body:", req.body);
    console.log("User:", req.user?.email || req.user?.id);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: "Password changed successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};