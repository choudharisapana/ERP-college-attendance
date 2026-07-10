import { sendBrevoMail } from "./brevoMail.js";

export const sendVerificationEmail = async (
  user,
  verificationLink
) => {
  return sendBrevoMail({
    to: user.email,
    name: user.name,
    subject: "Verify Your Email - EduScheduler",
    html: `
      <h2>Hello ${user.name}</h2>

      <p>Please verify your email.</p>

      <a href="${verificationLink}">
      Verify Email
      </a>

      <br><br>

      ${verificationLink}
    `,
  });
};
