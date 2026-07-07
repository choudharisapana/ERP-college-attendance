import Settings from "../models/Settings.js";
import User from "../models/User.js";

export const getSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    let settings = await Settings.findOne({ userId });
    if (!settings) {
      settings = await Settings.create({
        userId,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    const user = await User.findById(userId);
    const isAdmin = user?.role === "admin";
    const settingsData = isAdmin ? settings : settings.getPublicSettings();

    res.status(200).json({
      success: true,
      data: settingsData,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching settings",
      error: error.message,
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;
    delete updateData._id;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.createdBy;

    updateData.updatedBy = userId;
    let settings = await Settings.findOneAndUpdate({ userId }, updateData, {
      new: true,
      runValidators: true,
      upsert: true,
    });

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating settings",
      error: error.message,
    });
  }
};

export const resetSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    await Settings.findOneAndDelete({ userId });
    const settings = await Settings.create({
      userId,
      createdBy: userId,
      updatedBy: userId,
    });

    res.status(200).json({
      success: true,
      message: "Settings reset to default",
      data: settings,
    });
  } catch (error) {
    console.error("Error resetting settings:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting settings",
      error: error.message,
    });
  }
};

export const patchSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const patchData = req.body;

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = await Settings.create({
        userId,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    Object.keys(patchData).forEach((key) => {
      if (typeof patchData[key] === "object" && patchData[key] !== null) {
        Object.keys(patchData[key]).forEach((nestedKey) => {
          settings[key][nestedKey] = patchData[key][nestedKey];
        });
      } else {
        settings[key] = patchData[key];
      }
    });

    settings.updatedBy = userId;
    await settings.save();

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error patching settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating settings",
      error: error.message,
    });
  }
};

export const getSystemSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const systemSettings = await Settings.findOne({
      userId: req.user._id,
    }).select("systemSettings");

    res.status(200).json({
      success: true,
      data: systemSettings?.systemSettings || {},
    });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching system settings",
      error: error.message,
    });
  }
};