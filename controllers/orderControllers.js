import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/orderModels.js";
import userModel from "../models/userModels.js";
import { createShipment } from "../helper/createShipment.js";
import { getShipmentDetails } from "../helper/getShipmentDetails.js";
import { sendOrderPlacedAdminEmail, sendOrderPlacedUserEmail } from "../utils/sendEmail.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

export const createOrder = async (req, res) => {
  try {
    console.log("========== CREATE ORDER START ==========");
    console.log("req.user:", req.user);
    console.log("req.body:", req.body);

    const { amount } = req.body || {};

    console.log("amount received:", amount);

    if (!amount || Number(amount) < 1) {
      return res.status(400).json({
        success: false,
        message: "Amount must be at least ₹1",
      });
    }

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("Razorpay create order options:", options);

    const order = await razorpay.orders.create(options);

    console.log("Razorpay order created:", order);
    console.log("========== CREATE ORDER END ==========");

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.log("CREATE ORDER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    console.log("========== VERIFY PAYMENT START ==========");
    console.log("req.user:", req.user);
    console.log("req.body:", req.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    const userId = req.user.id;

    console.log("razorpay_order_id:", razorpay_order_id);
    console.log("razorpay_payment_id:", razorpay_payment_id);
    console.log("razorpay_signature:", razorpay_signature);
    console.log("orderData:", orderData);

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("expectedSign:", expectedSign);

    if (expectedSign !== razorpay_signature) {
      console.log("Payment signature mismatch");
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    if (!orderData?.items?.length) {
      return res.status(400).json({
        success: false,
        message: "No order items found",
      });
    }

    const normalizedItems = orderData.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      image: item.image || "",
      variant: item.variant,
      price: Number(item.price),
      qty: Number(item.qty),
      deliveryCharge: Number(item.deliveryCharge || 0),
    }));

    console.log("normalizedItems:", normalizedItems);

    const subTotal = normalizedItems.reduce(
      (acc, item) => acc + item.price * item.qty,
      0,
    );

    const totalDeliveryCharge = normalizedItems.reduce(
      (acc, item) => acc + item.deliveryCharge * item.qty,
      0,
    );

    const totalAmount = subTotal + totalDeliveryCharge;

    console.log("subTotal:", subTotal);
    console.log("totalDeliveryCharge:", totalDeliveryCharge);
    console.log("totalAmount:", totalAmount);
    console.log("shippingAddress received:", orderData.shippingAddress);

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const newOrder = await Order.create({
      user: userId,
      items: normalizedItems,
      subTotal,
      totalDeliveryCharge,
      totalAmount,
      address: orderData.address,
      shippingAddress: orderData.shippingAddress || {},
      phone: orderData.phone || user.phoneNumber || "",
      name: orderData.name || user.name || "",
      email: req.user.email,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentStatus: "paid",
      deliveryStatus: "processing",
    });

    console.log("Order saved in DB:", newOrder);

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        $push: { orders: newOrder._id },
      },
      { new: true },
    );

    console.log("Updated user after pushing order ID:", updatedUser?._id);
    console.log("User orders array:", updatedUser?.orders);

    const shipment = await createShipment(newOrder);

    console.log("Shipment response from Shiprocket helper:", shipment);

    if (
      shipment &&
      (shipment?.shipment_id ||
        shipment?.payload?.shipment_id ||
        shipment?.data?.shipment_id)
    ) {
      newOrder.shipmentId =
        shipment?.shipment_id?.toString() ||
        shipment?.payload?.shipment_id?.toString() ||
        shipment?.data?.shipment_id?.toString() ||
        "";

      newOrder.trackingUrl =
        shipment?.tracking_url ||
        shipment?.payload?.tracking_url ||
        shipment?.data?.tracking_url ||
        "";

      newOrder.awbCode =
        shipment?.awb_code ||
        shipment?.payload?.awb_code ||
        shipment?.data?.awb_code ||
        "";

      newOrder.courierName =
        shipment?.courier_name ||
        shipment?.payload?.courier_name ||
        shipment?.data?.courier_name ||
        "";

      newOrder.deliveryStatus = "shipped";
    } else {
      console.log("Shipment creation failed or invalid response:", shipment);
      newOrder.deliveryStatus = "processing";
    }

    await newOrder.save();

    // send emails after successful order save
    try {
      await sendOrderPlacedUserEmail({
        user,
        order: newOrder,
      });
    } catch (emailError) {
      console.error("Failed to send user order email:", emailError.message);
    }

    try {
      await sendOrderPlacedAdminEmail({
        user,
        order: newOrder,
      });
    } catch (emailError) {
      console.error("Failed to send admin order email:", emailError.message);
    }

    console.log("========== VERIFY PAYMENT END ==========");

    return res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (err) {
    console.log("VERIFY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    console.log("getMyOrders req.user:", req.user);

    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    console.log("My orders count:", orders.length);

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.log("getMyOrders error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    console.log("getAllOrders req.user:", req.user);

    const orders = await Order.find()
      .populate("user", "name email phoneNumber")
      .sort({ createdAt: -1 });

    console.log("All orders count:", orders.length);

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.log("getAllOrders error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const refreshShipmentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("Refreshing shipment for order:", orderId);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.shipmentId) {
      return res.status(400).json({
        success: false,
        message: "Shipment not created yet",
      });
    }

    const shipmentData = await getShipmentDetails(order.shipmentId);

    if (!shipmentData) {
      return res.status(500).json({
        success: false,
        message: "Unable to fetch shipment details",
      });
    }

    const track = shipmentData?.tracking_data?.shipment_track?.[0] || {};

    order.awbCode = track?.awb_code || order.awbCode;

    order.courierName = track?.courier_name || order.courierName;

    order.trackingUrl =
      shipmentData?.tracking_data?.track_url || order.trackingUrl;

    order.deliveryStatus =
      track?.current_status?.toLowerCase() || order.deliveryStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Shipment status updated",
      order,
    });
  } catch (error) {
    console.log("refreshShipmentStatus error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
