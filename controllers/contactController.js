import { sendContactFormEmail } from "../utils/sendEmail.js";

export const sendContactRequest = async (req, res) => {
  try {
    const { fullName, phone, email, problem, duration } = req.body;

    if (!fullName || !phone || !email || !problem) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    await sendContactFormEmail({
      fullName,
      phone,
      email,
      problem,
      duration,
    });

    return res.status(200).json({
      success: true,
      message: "Contact request sent successfully",
    });
  } catch (error) {
    console.error("sendContactRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while sending contact request",
    });
  }
};