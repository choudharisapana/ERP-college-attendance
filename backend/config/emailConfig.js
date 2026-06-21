import dotenv from "dotenv";
dotenv.config();   
import nodemailer from 'nodemailer';

// console.log("EMAIL_USER in config:", process.env.EMAIL_USER);
// console.log("EMAIL_PASSWORD in config:", process.env.EMAIL_PASSWORD);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export default transporter;