import express from "express";
import {
  createConsultationOrder,
  verifyConsultationPayment,
  getMyConsultations,
} from "../controllers/consultationController.js";
import authUser from "../middleware/auth.js";

const consultationRouter = express.Router();

consultationRouter.post("/create-order", authUser, createConsultationOrder);
consultationRouter.post("/verify-payment", authUser, verifyConsultationPayment);
consultationRouter.get("/my-consultations", authUser, getMyConsultations);

export default consultationRouter;