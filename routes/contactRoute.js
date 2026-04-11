import express from "express";
import { sendContactRequest } from "../controllers/contactController.js";

const router = express.Router();

router.post("/send", sendContactRequest);

export default router;