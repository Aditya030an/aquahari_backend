import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    quantity: {
      type: String,
    },

    variants: [
      {
        label: String, // "1 PCS", "4 PCS"
        price: Number, // 250, 1000
        discount: {
          type: Number,
          default: 0,
        },
        deliveryCharge: {
          type: Number,
          default: 0,
        },
      },
    ],

    images: [
      {
        url: String,
        public_id: String,
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
