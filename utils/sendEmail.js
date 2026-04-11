import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

export async function sendResetPasswordEmail(to, resetLink) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Aquahari Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Reset Your Aquahari Password",
      text: `Click this link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px; background:#f7f7f7;">
          <div style="max-width:500px; margin:auto; background:white; padding:30px; border-radius:10px;">
            
            <h2 style="color:#1F212E;">Reset Your Password</h2>
            
            <p style="color:#555;">
              We received a request to reset your Aquahari account password.
            </p>

            <p style="color:#555;">
              Click the button below to reset your password.
            </p>

            <div style="text-align:center; margin:30px 0;">
              <a 
                href="${resetLink}"
                style="
                  background:#1F212E;
                  color:white;
                  padding:12px 25px;
                  text-decoration:none;
                  border-radius:6px;
                  font-weight:bold;
                  display:inline-block;
                "
              >
                Reset Password
              </a>
            </div>

            <p style="font-size:14px; color:#888;">
              This link will expire in 15 minutes.
            </p>

            <p style="font-size:14px; color:#888;">
              If you didn’t request this, you can safely ignore this email.
            </p>

            <hr style="margin:30px 0;" />

            <p style="font-size:12px; color:#aaa;">
              Aquahari Support Team
            </p>

          </div>
        </div>
      `,
    });

    console.log("Reset password email sent to:", to);

  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Email sending failed");
  }
}

export async function sendLocationAlertEmails(employeeEmail, latitude, longitude) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const adminEmail = process.env.ADMIN_EMAIL; // Put admin's email in .env

    // Email to Admin
    await transporter.sendMail({
        from: `"Login Alert" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: "Employee Login Location Alert",
        html: `
            <h3>📍 Employee Login Detected</h3>
            <p><strong>Email:</strong> ${employeeEmail}</p>
            <p><strong>Coordinates:</strong> ${latitude}, ${longitude}</p>
            <p><a href="https://www.google.com/maps?q=${latitude},${longitude}" target="_blank">View on Google Maps</a></p>
            <p><em>Time: ${new Date().toLocaleString()}</em></p>
        `,
    });

    // Confirmation to Employee
    await transporter.sendMail({
        from: `"Login Info" <${process.env.EMAIL_USER}>`,
        to: employeeEmail,
        subject: "Location Shared with Admin",
        text: `Your current location (${latitude}, ${longitude}) has been sent to your supervisor.`,
    });
}


export async function sendEmailBookingConfirm(to, subject, message) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: `"Booking Confirmation" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: message
    });
}

export async function sendReferralEmail(by , to, referralCode , message) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: `"Referral Service" <${by}>`,
        to,
        subject: "You've been referred!",
        text: message ,
    });
}

export async function sendPhysioconnectEmail(to, subject, message) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: `"Physioconnect Service" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: message
    });
}

export const sendConfirmOrderEmail = async (order) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: "customer@email.com", // later dynamic
    subject: "Order Confirmed 🎉",
    html: `
      <h2>Order Placed</h2>
      <p>Product: ${order.productName}</p>
      <p>Total: ₹${order.total}</p>
      <p>Status: ${order.status}</p>
    `,
  });
};


export async function sendContactFormEmail({
  fullName,
  phone,
  email,
  problem,
  duration,
}) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const ownerEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    await transporter.sendMail({
      from: `"Aquahari Contact Form" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      replyTo: email,
      subject: `New Contact Request from ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px; background:#f7f7f7;">
          <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:10px;">
            <h2 style="color:#1F212E; margin-bottom:20px;">New Contact Form Submission</h2>

            <p><strong>Full Name:</strong> ${fullName}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Problem:</strong><br/>${problem}</p>
            <p><strong>Duration:</strong><br/>${duration || "Not provided"}</p>

            <hr style="margin:30px 0;" />

            <p style="font-size:12px; color:#888;">
              This message was sent from the Aquahari contact form.
            </p>
          </div>
        </div>
      `,
    });

    // optional confirmation to customer
    await transporter.sendMail({
      from: `"Aquahari Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "We received your request",
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px; background:#f7f7f7;">
          <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:10px;">
            <h2 style="color:#1F212E;">Thank you for contacting Aquahari</h2>
            <p>Hi ${fullName},</p>
            <p>We have received your request and will get back to you soon.</p>

            <p><strong>Your issue:</strong></p>
            <p>${problem}</p>

            <p style="margin-top:25px;">Regards,<br/>Aquahari Support Team</p>
          </div>
        </div>
      `,
    });

    console.log("Contact form email sent successfully");
  } catch (error) {
    console.error("Contact form email error:", error);
    throw new Error("Failed to send contact email");
  }
}