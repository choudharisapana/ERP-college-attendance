import express from "express";
import Settings from "../models/Settings.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get user settings
router.get("/", protect, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({
        userId: req.user._id,
        theme: "light",
        language: "en",
        fontSize: "medium",
        emailNotifications: true,
        compactView: false
      });
      await settings.save();
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// Update settings
router.put("/", protect, async (req, res) => {
  try {
    const { theme, language, fontSize, emailNotifications, compactView } = req.body;
    
    let settings = await Settings.findOne({ userId: req.user._id });
    
    if (!settings) {
      settings = new Settings({ userId: req.user._id });
    }
    
    // Update only provided fields
    if (theme !== undefined) settings.theme = theme;
    if (language !== undefined) settings.language = language;
    if (fontSize !== undefined) settings.fontSize = fontSize;
    if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
    if (compactView !== undefined) settings.compactView = compactView;
    
    settings.updatedAt = Date.now();
    await settings.save();
    
    res.json({
      success: true,
      data: settings,
      message: "Settings updated successfully"
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// Reset to default settings
router.post("/reset", protect, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user._id },
      {
        theme: "light",
        language: "en",
        fontSize: "medium",
        emailNotifications: true,
        compactView: false,
        updatedAt: Date.now()
      },
      { new: true, upsert: true }
    );
    
    res.json({
      success: true,
      data: settings,
      message: "Settings reset to default"
    });
  } catch (error) {
    console.error("Error resetting settings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

export default router;