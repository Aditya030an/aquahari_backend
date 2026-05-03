import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    capacity: {
      type: String,
      required: true,
      default: 0,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    baseDeliveryPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    deliveryPricePerBottle: {
      type: Number,
      required: true,
      default: 0,
    },

    availableStock:{
      type:Boolean,
      required:true,
      default:true,
    },

    discount: {
      type: Number,
      default: 0,
    },

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
