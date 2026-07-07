import express from "express";
import Leave from "../models/Leave.js";
import Faculty from "../models/Faculty.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching leaves",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    console.log("POST BODY:", req.body);
    const leave = new Leave(req.body);
    await leave.save();
    res.status(201).json({
      success: true,
      message: "Leave submitted successfully",
      data: leave,
    });
  } catch (error) {
    console.error("Error creating leave:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/:id/assign-replacement", async (req, res) => {
  try {
    const { replacementFacultyId, replacementFacultyName, replacementFacultyEmail } = req.body;
    
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    leave.replacementFacultyId = replacementFacultyId;
    leave.replacementFacultyName = replacementFacultyName;
    leave.replacementFacultyEmail = replacementFacultyEmail;
    leave.replacementAssigned = true;
    leave.updatedAt = Date.now();

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Replacement faculty assigned successfully",
      data: leave,
    });
  } catch (error) {
    console.error("Error assigning replacement:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning replacement faculty",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }
    res.status(200).json({
      success: true,
      data: leave,
    });
  } catch (error) {
    console.error("Error fetching leave:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching leave",
      error: error.message,
    });
  }
});

router.get("/faculty/:facultyId", async (req, res) => {
  try {
    const leaves = await Leave.find({ facultyId: req.params.facultyId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error("Error fetching faculty leaves:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculty leaves",
      error: error.message,
    });
  }
});

router.get("/pending-replacement", async (req, res) => {
  try {
    const leaves = await Leave.find({
      status: "Approved",
      replacementAssigned: false,
      toDate: { $gte: new Date() }
    }).sort({ fromDate: 1 });
    
    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error("Error fetching pending replacement leaves:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending replacement leaves",
      error: error.message,
    });
  }
});

router.put("/:id/approve", async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    leave.status = "Approved";
    leave.updatedAt = Date.now();
    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave approved successfully",
      data: leave,
    });
  } catch (error) {
    console.error("Error approving leave:", error);
    res.status(500).json({
      success: false,
      message: "Error approving leave",
      error: error.message,
    });
  }
});

router.put("/:id/reject", async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    leave.status = "Rejected";
    leave.updatedAt = Date.now();
    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave rejected successfully",
      data: leave,
    });
  } catch (error) {
    console.error("Error rejecting leave:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting leave",
      error: error.message,
    });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const total = await Leave.countDocuments();
    const pending = await Leave.countDocuments({ status: "Pending" });
    const approved = await Leave.countDocuments({ status: "Approved" });
    const rejected = await Leave.countDocuments({ status: "Rejected" });
    const activeLeaves = await Leave.countDocuments({
      status: "Approved",
      fromDate: { $lte: new Date() },
      toDate: { $gte: new Date() }
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        activeLeaves
      }
    });
  } catch (error) {
    console.error("Error fetching leave stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching leave stats",
      error: error.message,
    });
  }
});

router.get("/range", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "From and To dates are required",
      });
    }

    const leaves = await Leave.find({
      fromDate: { $gte: new Date(from) },
      toDate: { $lte: new Date(to) }
    }).sort({ fromDate: 1 });

    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error("Error fetching leaves by range:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching leaves by range",
      error: error.message,
    });
  }
});

router.get("/status/:status", async (req, res) => {
  try {
    const { status } = req.params;
    const leaves = await Leave.find({ status }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error("Error fetching leaves by status:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching leaves by status",
      error: error.message,
    });
  }
});

export default router;