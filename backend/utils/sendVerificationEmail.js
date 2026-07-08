import transporter from "../config/emailConfig.js";

export const sendVerificationEmail = async (user, verificationLink) => {
  try {
    const mailOptions = {
      from: `"EduScheduler" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Verify Your Email - EduScheduler",
      html: `
        <div style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">Welcome to EduScheduler! 🎓</h2>
            </div>
            <div style="padding: 30px; color: #333;">
              <p>Dear <strong>${user.name}</strong>,</p>
              <p>Thank you for registering with EduScheduler! Please verify your email address to complete your registration.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" 
                   style="background: #4F46E5; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;
                          font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all;">
                ${verificationLink}
              </p>
              
              <p><strong>Note:</strong> This link will expire in 24 hours.</p>
              
              <hr style="margin: 20px 0;">
              <p style="font-size: 12px; color: #777;">
                If you didn't create an account with EduScheduler, please ignore this email.
              </p>
            </div>
            <div style="background: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #777;">
              EduScheduler - Smart Timetable Management System
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

console.log("Verification email sent:", info.messageId);

return {
  success: true,
  messageId: info.messageId,
};
  } catch (error) {
    console.error("Verification email error:", error);
  }
};