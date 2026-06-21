
import express from "express";
import userController from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();


router.use(protect);

// ================= USER (admin + user dono) =================
router.get("/profile", authorize("user"), userController.getProfile);
router.put("/profile", authorize("user"), userController.updateProfile);
router.put("/change-password", authorize("user"), userController.changePassword);
router.put("/preferences", authorize("user"), userController.updatePreferences);


// ================= ADMIN ONLY =================
router.get("/", authorize("admin"), userController.getUsers);
router.get("/:id", authorize("admin"), userController.getUser);
router.post("/", authorize("admin"), userController.createUser);
router.put("/:id", authorize("admin"), userController.updateUser);
router.delete("/:id", authorize("admin"), userController.deleteUser);

// ================= EXTRA ADMIN =================
router.get("/stats", authorize("admin"), userController.getUserStats);
router.put("/:id/reset-password", authorize("admin"), userController.resetPassword);
router.post("/bulk", authorize("admin"), userController.bulkCreateUsers);
router.put("/bulk-deactivate", authorize("admin"), userController.bulkDeactivateUsers);
router.get("/search", authorize("admin"), userController.searchUsers);

export default router;