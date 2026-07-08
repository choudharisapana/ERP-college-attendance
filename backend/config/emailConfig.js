// import dotenv from "dotenv";
// import nodemailer from "nodemailer";

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true, // SSL
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
//   connectionTimeout: 10000,
//   greetingTimeout: 10000,
//   socketTimeout: 10000,
// });

// transporter.verify()
//   .then(() => {
//     console.log("✅ Email transporter ready");
//   })
//   .catch((err) => {
//     console.error("❌ Email transporter error:", err.message);
//   });

// export default transporter;


import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify()
  .then(() => console.log("✅ Brevo SMTP Connected"))
  .catch((err) => console.error("❌ Brevo SMTP Error:", err.message));

export default transporter;