import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: String,
    phone: String,
    address: String,

    productId: String,
    productName: String,

    variant: String,
    price: Number,
    qty: Number,
    total: Number,

    paymentId: String,
    status: {
      type: String,
      default: "Placed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);