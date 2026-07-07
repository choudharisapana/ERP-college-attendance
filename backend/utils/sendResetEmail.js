import transporter from "../config/emailConfig.js";

export const sendResetEmail = async (user, resetLink) => {
  try {
    const mailOptions = {
      from: `"EduScheduler" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset - EduScheduler",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Reset Your Password</h2>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" 
             style="background: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
          <p>Link expires in 1 hour.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reset email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error("Reset email error:", error);
    return { success: false, error: error.message };
  }
};