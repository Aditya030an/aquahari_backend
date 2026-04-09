import express from "express";

import { createOrder, getAllOrders, getMyOrders, verifyPayment } from "../controllers/orderControllers.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

orderRouter.post("/create-order",authUser , createOrder);
orderRouter.post("/verify-payment",authUser ,  verifyPayment);

orderRouter.get("/my-orders", authUser, getMyOrders);

orderRouter.get("/all-orders", authUser, getAllOrders);

export default orderRouter;
