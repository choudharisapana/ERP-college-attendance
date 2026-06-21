// backend/routes/auth.js
import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  verifyEmail,           // 🔥 Add this
  resendVerificationEmail // 🔥 Add this
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);  // 🔥 Add this
router.post("/resend-verification", resendVerificationEmail); // 🔥 Add this

router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.post("/forgot-password", forgotPassword);

export default router;