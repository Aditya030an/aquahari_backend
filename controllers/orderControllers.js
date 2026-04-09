// import crypto from "crypto";
// import Order from "../models/orderModels.js";

// export const verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       orderData,
//     } = req.body;

//     const sign = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSign = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(sign.toString())
//       .digest("hex");

//     if (expectedSign !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification failed",
//       });
//     }

//     // ✅ Save order
//     const newOrder = await Order.create({
//       ...orderData,
//       paymentId: razorpay_payment_id,
//       status: "Placed",
//     });

//     res.json({
//       success: true,
//       message: "Order placed successfully",
//       order: newOrder,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// export const createOrder = async (req, res) => {
//   try {
//     const { amount } = req.body;

//     const options = {
//       amount: amount * 100, // ₹ → paise
//       currency: "INR",
//       receipt: "receipt_" + Date.now(),
//     };

//     const order = await razorpay.orders.create(options);

//     res.json({
//       success: true,
//       order,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/orderModels.js";
import userModel from "../models/userModels.js";


import { sendToShiprocket } from "./shiprocketService.js";
import { sendConfirmOrderEmail } from "../utils/sendEmail.js";

// ✅ INIT RAZORPAY
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ✅ CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Amount must be at least ₹1",
      });
    }

    const options = {
      amount: amount * 100, // ₹ → paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    console.log("options", options);

    const order = await razorpay.orders.create(options);

    console.log("order", order);

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.log("CREATE ORDER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // ✅ SAVE ORDER WITH USER ID
    const newOrder = await Order.create({
      ...orderData,
      userId: req.userId, // ✅ IMPORTANT
      paymentId: razorpay_payment_id,
      status: "Placed",
    });

    await sendConfirmOrderEmail(newOrder);

    await sendToShiprocket(newOrder);

    // ✅ PUSH ORDER ID INTO USER
    await User.findByIdAndUpdate(req.userId, {
      $push: { orders: newOrder._id },
    });

    res.json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (err) {
    console.log("VERIFY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name phoneNumber")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




