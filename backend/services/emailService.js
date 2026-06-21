import transporter from "../config/emailConfig.js";
import getSuggestionEmailTemplate from "../utils/emailTemplates.js";

export const sendAdminNotification = async (suggestionData) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "supporteduschedular@gmail.com", // Sirf ye email
      subject: `New Suggestion: ${suggestionData.category || "General"} - ${new Date().toLocaleDateString()}`,
      html: getSuggestionEmailTemplate(suggestionData),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email: ", error);
    return { success: false, error: error.message };
  }
};

export const sendBulkEmail = async (emails, subject, message) => {
  try {
    const mailOptions = {
      from: `"Admin - EduScheduler" <${process.env.EMAIL_USER}>`,
      bcc: emails,
      subject,
      html: `
        <h2>${subject}</h2>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Email error:", error);
  }
};

// Send confirmation to USER (who submitted the ticket)
export const sendSupportConfirmation = async (ticket) => {
  try {
    const mailOptions = {
      from: `"EduScheduler Support" <${process.env.EMAIL_USER}>`,
      to: ticket.email, // User ko confirmation
      subject: `Support Ticket Confirmation - ${ticket.ticketNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <div style="background: #4CAF50; color: white; padding: 15px; text-align: center;">
              <h2>Support Ticket Confirmation</h2>
            </div>
            <div style="padding: 20px; color: #333;">
              <p>Dear ${ticket.name},</p>
              <p>Thank you for contacting EduScheduler Support. Your ticket has been successfully created.</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
                <p><strong>Subject:</strong> ${ticket.subject}</p>
                <p><strong>Status:</strong> Open</p>
                <p><strong>Urgency:</strong> ${ticket.urgencyLevel.toUpperCase()}</p>
              </div>
              <p>Our support team will review your ticket and get back to you within 24-48 hours.</p>
              <p>You can check your ticket status using the ticket number above.</p>
              <hr style="margin: 20px 0;">
              <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply directly to this email.</p>
            </div>
            <div style="background: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #777;">
              EduScheduler Support System
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Support confirmation sent to ${ticket.email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Support confirmation error:", error);
    return { success: false, error: error.message };
  }
};

// Send notification to ADMIN (sirf supporteduschedular@gmail.com)
export const sendSupportNotification = async (ticket) => {
  try {
    const mailOptions = {
      from: `"EduScheduler Support" <${process.env.EMAIL_USER}>`,
      to: "supporteduschedular@gmail.com", // Sirf ye email - swejaltembhare044@gmail.com hata diya
      subject: `NEW SUPPORT TICKET: ${ticket.ticketNumber} - ${ticket.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <div style="background: #FF5722; color: white; padding: 15px; text-align: center;">
              <h2>⚠️ New Support Ticket Received</h2>
            </div>
            <div style="padding: 20px; color: #333;">
              <div style="background: #FFF3E0; padding: 10px; border-left: 4px solid #FF5722; margin-bottom: 15px;">
                <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
                <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
              
              <h3 style="color: #FF5722;">User Information:</h3>
              <p><strong>Name:</strong> ${ticket.name}</p>
              <p><strong>Email:</strong> ${ticket.email}</p>
              <p><strong>Subject:</strong> ${ticket.subject}</p>
              
              <h3 style="color: #FF5722;">Message:</h3>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0;">
                ${ticket.message.replace(/\n/g, '<br>')}
              </div>
              
              <p><strong>Urgency Level:</strong> 
                <span style="background: ${
                  ticket.urgencyLevel === 'high' ? '#FF5722' : 
                  ticket.urgencyLevel === 'medium' ? '#FFC107' : '#4CAF50'
                }; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">
                  ${ticket.urgencyLevel.toUpperCase()}
                </span>
              </p>
              
              <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">OPEN</span></p>
              
              <hr style="margin: 20px 0;">
              <div style="background: #f1f1f1; padding: 10px; border-radius: 5px;">
                <p style="margin: 0; font-size: 12px;">Action Required: Please review and respond to this ticket within 24 hours.</p>
              </div>
            </div>
            <div style="background: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #777;">
              EduScheduler Support System - Admin Notification
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Admin notification sent to supporteduschedular@gmail.com:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Support notification error:", error);
    return { success: false, error: error.message };
  }
};

export default {
  sendAdminNotification,
  sendBulkEmail,
  sendSupportConfirmation,
  sendSupportNotification,
};