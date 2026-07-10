import { sendBrevoMail } from "./brevoMail.js";

export const sendResetEmail = async (
  user,
  resetLink
) => {
  return sendBrevoMail({
    to: user.email,
    name: user.name,
    subject: "Reset Password - EduScheduler",
    html: `
      <h2>Hello ${user.name}</h2>

      <p>Reset your password.</p>

      <a href="${resetLink}">
      Reset Password
      </a>

      <br><br>

      ${resetLink}
    `,
  });
};