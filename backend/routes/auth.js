import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  changePassword,

} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword); 
router.put("/change-password", protect, changePassword);

router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

export default router;