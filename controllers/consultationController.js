import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import userModel from "../models/userModels.js";

export const createConsultationOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planTitle, price } = req.body;

    if (!planTitle || !price) {
      return res.status(400).json({
        success: false,
        message: "Plan title and price are required",
      });
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation price",
      });
    }

    const user = await userModel.findById(userId).select("_id name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const options = {
      amount: numericPrice * 100,
      currency: "INR",
      receipt: `consultation_${Date.now()}`,
      notes: {
        userId: String(userId),
        planTitle,
        price: String(numericPrice),
        type: "consultation",
      },
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY,
      message: "Consultation order created successfully",
    });
  } catch (error) {
    console.error("createConsultationOrder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create consultation order",
    });
  }
};

export const verifyConsultationPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planTitle,
      price,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !planTitle ||
      !price
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation price",
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // prevent duplicate save for same successful payment/order
    const alreadyExists = user.consultations.find(
      (item) =>
        item.razorpayOrderId === razorpay_order_id ||
        item.razorpayPaymentId === razorpay_payment_id
    );

    if (alreadyExists) {
      return res.status(200).json({
        success: true,
        message: "Consultation payment already verified",
        consultation: alreadyExists,
      });
    }

    const newConsultation = {
      planTitle,
      price: numericPrice,
      currency: "INR",
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      consultationStatus: "pending",
      bookedAt: new Date(),
    };

    user.consultations.push(newConsultation);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Consultation payment verified successfully",
      consultation: newConsultation,
    });
  } catch (error) {
    console.error("verifyConsultationPayment error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

export const getMyConsultations = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userModel
      .findById(userId)
      .select("name email consultations");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const consultations = [...(user.consultations || [])].sort(
      (a, b) => new Date(b.bookedAt) - new Date(a.bookedAt)
    );

    return res.status(200).json({
      success: true,
      consultations,
    });
  } catch (error) {
    console.error("getMyConsultations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch consultations",
    });
  }
};