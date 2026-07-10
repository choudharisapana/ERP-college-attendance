import axios from "axios";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export const sendBrevoMail = async ({
  to,
  name,
  subject,
  html,
}) => {
  try {
    const response = await axios.post(
      BREVO_URL,
      {
        sender: {
          name: "EduScheduler",
          email: process.env.SENDER_EMAIL,
        },
        to: [
          {
            email: to,
            name,
          },
        ],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      }
    );

    console.log("Brevo:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (err) {
    console.error(
      "Brevo Error:",
      err.response?.data || err.message
    );

    return {
      success: false,
      error: err.response?.data || err.message,
    };
  }
};