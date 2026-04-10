import express from "express";

import {
  createOrder,
  getAllOrders,
  getMyOrders,
  refreshShipmentStatus,
  verifyPayment,
} from "../controllers/orderControllers.js";
import authUser from "../middleware/auth.js";
import authAdmin from "../middleware/authAdmin.js";

const orderRouter = express.Router();

orderRouter.post("/create-order", authUser, createOrder);
orderRouter.post("/verify-payment", authUser, verifyPayment);

orderRouter.get("/my-orders", authUser, getMyOrders);

orderRouter.get("/all-orders", authAdmin, getAllOrders);

orderRouter.get(
  "/refresh-shipment/:orderId",
  authUser,
  refreshShipmentStatus
);

export default orderRouter;
