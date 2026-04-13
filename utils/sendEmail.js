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

export async function sendConsultationEmail({ user, consultation }) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    await transporter.sendMail({
      from: `"Aquahari Consultation" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      replyTo: user?.email,
      subject: `New Consultation Payment - ${consultation?.planTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px; background:#f7f7f7;">
          <div style="max-width:650px; margin:auto; background:white; padding:30px; border-radius:10px;">
            <h2 style="color:#1F212E; margin-bottom:20px;">New Consultation Payment Received</h2>

            <h3 style="color:#333; margin-top:20px;">User Details</h3>
            <p><strong>Name:</strong> ${user?.name || "N/A"}</p>
            <p><strong>Email:</strong> ${user?.email || "N/A"}</p>
            <p><strong>Phone:</strong> ${user?.phoneNumber || "N/A"}</p>
            <p><strong>User ID:</strong> ${user?._id}</p>

            <hr style="margin:25px 0;" />

            <h3 style="color:#333;">Consultation Details</h3>
            <p><strong>Plan Title:</strong> ${consultation?.planTitle}</p>
            <p><strong>Price:</strong> ₹${consultation?.price}</p>
            <p><strong>Currency:</strong> ${consultation?.currency}</p>
            <p><strong>Payment Status:</strong> ${consultation?.paymentStatus}</p>
            <p><strong>Consultation Status:</strong> ${consultation?.consultationStatus}</p>
            <p><strong>Booked At:</strong> ${new Date(consultation?.bookedAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}</p>

            <hr style="margin:25px 0;" />

            <h3 style="color:#333;">Razorpay Details</h3>
            <p><strong>Order ID:</strong> ${consultation?.razorpayOrderId}</p>
            <p><strong>Payment ID:</strong> ${consultation?.razorpayPaymentId}</p>
            <p><strong>Signature:</strong> ${consultation?.razorpaySignature}</p>

            <hr style="margin:30px 0;" />

            <p style="font-size:12px; color:#888;">
              This email was generated automatically after successful consultation payment verification.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Consultation email sent to admin:", adminEmail);
  } catch (error) {
    console.error("Consultation email sending error:", error);
    throw new Error("Failed to send consultation email");
  }
}

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const escapeHtml = (value) => {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getAddressHtml = (shippingAddress = {}) => {
  const parts = [
    shippingAddress?.fullName,
    shippingAddress?.phone,
    shippingAddress?.addressLine1,
    shippingAddress?.addressLine2,
    shippingAddress?.landmark,
    shippingAddress?.city,
    shippingAddress?.state,
    shippingAddress?.pincode,
    shippingAddress?.country,
  ].filter(Boolean);

  if (!parts.length) return "Not available";

  return parts.map((item) => escapeHtml(item)).join("<br/>");
};

const getItemsRowsHtml = (items = []) => {
  return items
    .map((item, index) => {
      const itemSubTotal =
        Number(item?.price || 0) * Number(item?.qty || 0);

      const itemDelivery = Number(item?.deliveryCharge || 0);

      const itemTotal = itemSubTotal + itemDelivery;

      return `
        <tr>
          <td style="padding:14px 12px; border-bottom:1px solid #eee; vertical-align:top;">
            <div style="font-weight:600; color:#111827;">${index + 1}. ${escapeHtml(item?.productName || "Product")}</div>
            <div style="font-size:12px; color:#6b7280; margin-top:4px;">
              Bottle Size: ${escapeHtml(item?.capacity || "N/A")}
            </div>
          </td>
          <td style="padding:14px 12px; border-bottom:1px solid #eee; text-align:center;">
            ${escapeHtml(item?.qty || 1)}
          </td>
          <td style="padding:14px 12px; border-bottom:1px solid #eee; text-align:right;">
            ${formatCurrency(item?.price)}
          </td>
          <td style="padding:14px 12px; border-bottom:1px solid #eee; text-align:right;">
            ${formatCurrency(itemDelivery|| 0)}
          </td>
          <td style="padding:14px 12px; border-bottom:1px solid #eee; text-align:right; font-weight:600;">
            ${formatCurrency(itemTotal)}
          </td>
        </tr>
      `;
    })
    .join("");
};

export async function sendOrderPlacedUserEmail({ user, order }) {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Aquahari" <${process.env.EMAIL_USER}>`,
      to: user?.email,
      subject: `Order Confirmed • ${order?._id}`,
      html: `
        <div style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, sans-serif;">
          <div style="max-width:700px; margin:0 auto; padding:24px 12px;">
            <div style="background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
              
              <div style="background:linear-gradient(135deg, #111827, #1f2937); color:#ffffff; padding:28px 32px;">
                <div style="font-size:24px; font-weight:700;">Aquahari</div>
                <div style="margin-top:8px; font-size:20px; font-weight:600;">Your order has been confirmed</div>
                <div style="margin-top:6px; font-size:14px; color:#d1d5db;">
                  Thank you for shopping with us, ${escapeHtml(user?.name || order?.name || "Customer")}.
                </div>
              </div>

              <div style="padding:28px 32px;">
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:18px 20px; margin-bottom:24px;">
                  <div style="font-size:14px; color:#6b7280; margin-bottom:8px;">Order Summary</div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#374151;">Order ID</span>
                    <span style="font-weight:600; color:#111827;">${escapeHtml(order?.orderId || order?._id)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#374151;">Payment ID</span>
                    <span style="font-weight:600; color:#111827;">${escapeHtml(order?.paymentId || "N/A")}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#374151;">Payment Status</span>
                    <span style="font-weight:700; color:#16a34a; text-transform:capitalize;">${escapeHtml(order?.paymentStatus || "paid")}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#374151;">Delivery Status</span>
                    <span style="font-weight:700; color:#2563eb; text-transform:capitalize;">${escapeHtml(order?.deliveryStatus || "processing")}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:#374151;">Order Date</span>
                    <span style="font-weight:600; color:#111827;">${formatDateTime(order?.createdAt || new Date())}</span>
                  </div>
                </div>

                <div style="margin-bottom:24px;">
                  <div style="font-size:18px; font-weight:700; color:#111827; margin-bottom:12px;">Items Ordered</div>
                  <div style="overflow:hidden; border:1px solid #e5e7eb; border-radius:14px;">
                    <table style="width:100%; border-collapse:collapse; background:#fff;">
                      <thead style="background:#f9fafb;">
                        <tr>
                          <th style="padding:14px 12px; text-align:left; font-size:13px; color:#374151;">Product</th>
                          <th style="padding:14px 12px; text-align:center; font-size:13px; color:#374151;">Qty</th>
                          <th style="padding:14px 12px; text-align:right; font-size:13px; color:#374151;">Price</th>
                          <th style="padding:14px 12px; text-align:right; font-size:13px; color:#374151;">Delivery</th>
                          <th style="padding:14px 12px; text-align:right; font-size:13px; color:#374151;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${getItemsRowsHtml(order?.items)}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr; gap:18px;">
                  <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:18px 20px; margin-bottom:18px;">
                    <div style="font-size:18px; font-weight:700; color:#111827; margin-bottom:12px;">Shipping Address</div>
                    <div style="font-size:14px; color:#374151; line-height:1.7;">
                      ${getAddressHtml(order?.shippingAddress)}
                    </div>
                  </div>

                  <div style="background:#111827; color:#ffffff; border-radius:14px; padding:20px;">
                    <div style="font-size:18px; font-weight:700; margin-bottom:14px;">Payment Breakdown</div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                      <span>Subtotal</span>
                      <span>${formatCurrency(order?.subTotal)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                      <span>Delivery Charge</span>
                      <span>${formatCurrency(order?.totalDeliveryCharge)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.2); font-size:18px; font-weight:700;">
                      <span>Total Paid</span>
                      <span>${formatCurrency(order?.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div style="margin-top:28px; font-size:14px; color:#6b7280; line-height:1.7;">
                  We’re preparing your order now. You’ll receive another update when your shipment moves forward.
                </div>
              </div>

              <div style="padding:18px 32px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;">
                © ${new Date().getFullYear()} Aquahari. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Order confirmation email sent to user:", user.email);
  } catch (error) {
    console.error("User order email error:", error);
    throw new Error("Failed to send user order email");
  }
}

export async function sendOrderPlacedAdminEmail({ user, order }) {
  try {
    const transporter = createTransporter();

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    await transporter.sendMail({
      from: `"Aquahari Orders" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      replyTo: user?.email,
      subject: `New Order Received • ${order?._id}`,
      html: `
        <div style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, sans-serif;">
          <div style="max-width:760px; margin:0 auto; padding:24px 12px;">
            <div style="background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
              
              <div style="background:linear-gradient(135deg, #0f172a, #1e293b); color:#ffffff; padding:28px 32px;">
                <div style="font-size:24px; font-weight:700;">Aquahari Admin</div>
                <div style="margin-top:8px; font-size:20px; font-weight:600;">A customer has placed a new order</div>
                <div style="margin-top:6px; font-size:14px; color:#cbd5e1;">
                  Review the customer and order information below.
                </div>
              </div>

              <div style="padding:28px 32px;">
                <div style="display:grid; grid-template-columns:1fr; gap:18px;">
                  <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:18px 20px;">
                    <div style="font-size:18px; font-weight:700; color:#111827; margin-bottom:12px;">Customer Details</div>
                    <p style="margin:6px 0; color:#374151;"><strong>Name:</strong> ${escapeHtml(user?.name || order?.name || "N/A")}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>Email:</strong> ${escapeHtml(user?.email || order?.email || "N/A")}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>Phone:</strong> ${escapeHtml(user?.phoneNumber || order?.phone || "N/A")}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>User ID:</strong> ${escapeHtml(user?._id || "N/A")}</p>
                  </div>

                  <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:18px 20px;">
                    <div style="font-size:18px; font-weight:700; color:#111827; margin-bottom:12px;">Order Details</div>
                    <p style="margin:6px 0; color:#374151;"><strong>DB Order ID:</strong> ${escapeHtml(order?._id)}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>Razorpay Order ID:</strong> ${escapeHtml(order?.orderId || "N/A")}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>Payment ID:</strong> ${escapeHtml(order?.paymentId || "N/A")}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>Payment Status:</strong> ${escapeHtml(order?.paymentStatus || "paid")}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>Delivery Status:</strong> ${escapeHtml(order?.deliveryStatus || "processing")}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>Created At:</strong> ${formatDateTime(order?.createdAt || new Date())}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>Shipment ID:</strong> ${escapeHtml(order?.shipmentId || "Not generated")}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>AWB Code:</strong> ${escapeHtml(order?.awbCode || "Not available")}</p>
                    <p style="margin:6px 0; color:#374151;"><strong>Courier:</strong> ${escapeHtml(order?.courierName || "Not assigned")}</p>
                  </div>
                </div>

                <div style="margin:24px 0;">
                  <div style="font-size:18px; font-weight:700; color:#111827; margin-bottom:12px;">Ordered Items</div>
                  <div style="overflow:hidden; border:1px solid #e5e7eb; border-radius:14px;">
                    <table style="width:100%; border-collapse:collapse; background:#fff;">
                      <thead style="background:#f9fafb;">
                        <tr>
                          <th style="padding:14px 12px; text-align:left; font-size:13px; color:#374151;">Product</th>
                          <th style="padding:14px 12px; text-align:center; font-size:13px; color:#374151;">Qty</th>
                          <th style="padding:14px 12px; text-align:right; font-size:13px; color:#374151;">Price</th>
                          <th style="padding:14px 12px; text-align:right; font-size:13px; color:#374151;">Delivery</th>
                          <th style="padding:14px 12px; text-align:right; font-size:13px; color:#374151;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${getItemsRowsHtml(order?.items)}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr; gap:18px;">
                  <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:18px 20px;">
                    <div style="font-size:18px; font-weight:700; color:#111827; margin-bottom:12px;">Shipping Address</div>
                    <div style="font-size:14px; color:#374151; line-height:1.7;">
                      ${getAddressHtml(order?.shippingAddress)}
                    </div>
                  </div>

                  <div style="background:#111827; color:#ffffff; border-radius:14px; padding:20px;">
                    <div style="font-size:18px; font-weight:700; margin-bottom:14px;">Amount Summary</div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                      <span>Subtotal</span>
                      <span>${formatCurrency(order?.subTotal)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                      <span>Delivery Charge</span>
                      <span>${formatCurrency(order?.totalDeliveryCharge)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.2); font-size:18px; font-weight:700;">
                      <span>Total</span>
                      <span>${formatCurrency(order?.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style="padding:18px 32px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;">
                Automated order notification from Aquahari.
              </div>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Order notification email sent to admin:", adminEmail);
  } catch (error) {
    console.error("Admin order email error:", error);
    throw new Error("Failed to send admin order email");
  }
}