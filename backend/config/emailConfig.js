import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const emailPass = process.env.EMAIL_PASSWORD
  ? process.env.EMAIL_PASSWORD.replace(/\s/g, "")
  : "";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPass,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error.message);
  } else {
    console.log("Email transporter ready");
  }
});

export default transporter;