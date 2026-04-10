import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        image: { type: String, default: "" },
        variant: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true },
        deliveryCharge: { type: Number, default: 0 },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    subTotal: {
      type: Number,
      default: 0,
    },

    totalDeliveryCharge: {
      type: Number,
      default: 0,
    },

    address: {
      type: String,
      required: true,
    },

    shippingAddress: {
      fullAddress: { type: String, default: "" },
      landmark: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },

    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },

    paymentId: {
      type: String,
      default: "",
    },

    orderId: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    shipmentId: {
      type: String,
      default: "",
    },

    trackingUrl: {
      type: String,
      default: "",
    },

    awbCode: {
      type: String,
      default: "",
    },

    courierName: {
      type: String,
      default: "",
    },

    deliveryStatus: {
      type: String,
      default: "processing",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);