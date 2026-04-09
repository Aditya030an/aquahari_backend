import express from "express";
import { createOrder } from "../controllers/paymentController.js";
import authUser from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", authUser, createOrder);

export default router;