import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/orderModels.js";
import userModel from "../models/userModels.js";
import Product from "../models/productModels.js";
import {
  createShipment,
  getPickupLocations,
} from "../helper/createShipment.js";
import { getShipmentDetails } from "../helper/getShipmentDetails.js";
import {
  sendOrderPlacedAdminEmail,
  sendOrderPlacedUserEmail,
} from "../utils/sendEmail.js";

const checkProductAvailability = async (items = []) => {
  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      return {
        success: false,
        message: `${item.productName || "Product"} was not found`,
      };
    }

    if (product.availableStock === false) {
      return {
        success: false,
        message: `${product.name} is currently out of stock`,
      };
    }
  }

  return {
    success: true,
  };
};

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

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
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

    const availabilityCheck = await checkProductAvailability(orderData.items);

    if (!availabilityCheck.success) {
      return res.status(400).json({
        success: false,
        message: availabilityCheck.message,
      });
    }

    const normalizedItems = orderData.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      image: item.image || "",
      capacity: item.capacity || "",
      price: Number(item.price),
      qty: Number(item.qty),
      deliveryCharge: Number(item.deliveryCharge || 0),
    }));

    const subTotal = normalizedItems.reduce(
      (acc, item) => acc + item.price * item.qty,
      0,
    );

    const totalDeliveryCharge = normalizedItems.reduce(
      (acc, item) => acc + Number(item.deliveryCharge || 0),
      0,
    );

    const totalAmount = subTotal + totalDeliveryCharge;

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
      paymentMethod: "prepaid",
      paymentStatus: "paid",
      deliveryStatus: "processing",
    });

    await userModel.findByIdAndUpdate(
      userId,
      {
        $push: { orders: newOrder._id },
      },
      { returnDocument: "after" },
    );

    const getPickupLocation = await getPickupLocations();
    console.log("get pick up location", getPickupLocation);

    const shipment = await createShipment(newOrder);
    console.log("Shipment response from Shiprocket helper:", shipment);

    if (shipment && shipment?.shipment_id) {
      newOrder.shipmentId = shipment.shipment_id?.toString() || "";
      newOrder.trackingUrl = shipment.tracking_url || "";
      newOrder.awbCode = shipment.awb_code || "";
      newOrder.courierName = shipment.courier_name || "";
      newOrder.deliveryStatus = "shipment_created";
    } else {
      console.log("Shipment creation failed or invalid response:", shipment);
      newOrder.deliveryStatus = "shipment_failed";
    }

    await newOrder.save();

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

export const placeCODOrder = async (req, res) => {
  try {
    console.log("========== PLACE COD ORDER START ==========");
    console.log("req.user:", req.user);
    console.log("req.body:", req.body);

    const { orderData } = req.body;
    const userId = req.user.id;

    if (!orderData?.items?.length) {
      return res.status(400).json({
        success: false,
        message: "No order items found",
      });
    }

    const availabilityCheck = await checkProductAvailability(orderData.items);

if (!availabilityCheck.success) {
  return res.status(400).json({
    success: false,
    message: availabilityCheck.message,
  });
}

    const normalizedItems = orderData.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      image: item.image || "",
      capacity: item.capacity || "",
      price: Number(item.price),
      qty: Number(item.qty),
      deliveryCharge: Number(item.deliveryCharge || 0),
    }));

    const subTotal = normalizedItems.reduce(
      (acc, item) => acc + item.price * item.qty,
      0,
    );

    const totalDeliveryCharge = normalizedItems.reduce(
      (acc, item) => acc + Number(item.deliveryCharge || 0),
      0,
    );

    const totalAmount = subTotal + totalDeliveryCharge;

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
      paymentId: "",
      orderId: "",
      paymentMethod: "cod",
      paymentStatus: "pending",
      deliveryStatus: "processing",
    });

    await userModel.findByIdAndUpdate(
      userId,
      {
        $push: { orders: newOrder._id },
      },
      { returnDocument: "after" },
    );

    const getPickupLocation = await getPickupLocations();
    console.log("get pick up location", getPickupLocation);

    const shipment = await createShipment(newOrder);
    console.log("Shipment response from Shiprocket helper:", shipment);

    if (shipment && shipment?.shipment_id) {
      newOrder.shipmentId = shipment.shipment_id?.toString() || "";
      newOrder.trackingUrl = shipment.tracking_url || "";
      newOrder.awbCode = shipment.awb_code || "";
      newOrder.courierName = shipment.courier_name || "";
      newOrder.deliveryStatus = "shipment_created";
    } else {
      console.log("Shipment creation failed or invalid response:", shipment);
      newOrder.deliveryStatus = "shipment_failed";
    }

    await newOrder.save();

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

    console.log("========== PLACE COD ORDER END ==========");

    return res.status(200).json({
      success: true,
      message: "COD order placed successfully",
      order: newOrder,
    });
  } catch (err) {
    console.log("PLACE COD ORDER ERROR:", err);
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

    const data = shipmentData?.data || shipmentData || {};

    order.awbCode = data?.awb || data?.awb_code || order.awbCode;
    order.courierName =
      data?.courier || data?.courier_name || order.courierName;

    if (order.awbCode) {
      order.trackingUrl = `https://shiprocket.co/tracking/${order.awbCode}`;
    }

    const statusText = String(
      data?.current_status || data?.status || "",
    ).toLowerCase();

    if (statusText.includes("new") || statusText.includes("shipment created")) {
      order.deliveryStatus = "shipment_created";
    } else if (statusText.includes("shipped")) {
      order.deliveryStatus = "shipped";
    } else if (statusText.includes("transit")) {
      order.deliveryStatus = "in_transit";
    } else if (statusText.includes("delivered")) {
      order.deliveryStatus = "delivered";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Shipment status updated",
      order,
      shipmentData,
    });
  } catch (error) {
    console.log("refreshShipmentStatus error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
