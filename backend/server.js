dotenv.config({
  path: path.join(process.cwd(), ".env"),
});
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import batchRoutes from './routes/batches.js';
import classroomRoutes from "./routes/classrooms.js";
import authRoutes from "./routes/auth.js";
import subjectRoutes from "./routes/subjects.js";
import timetableRoutes from "./routes/timetables.js";
import facultyRoutes from "./routes/faculty.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from "./routes/dashboard.js";
import settingsRoutes from "./routes/settings.js";
import supportRoutes from "./routes/supportRoutes.js";


const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then((conn) => {
    console.log("MongoDB Connected:", conn.connection.name);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

app.use('/api/batches', batchRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/support", supportRoutes);


app.get("/api/test", (req, res) => {
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});